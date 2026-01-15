import { editor } from "express-document-sdk";

// =========================================================================
// VERSION CONTROL SYSTEM
// =========================================================================

/**
 * Helper: Get text content from a node
 */
const getTextContent = (node) => {
    if (!node) return "";
    let text = "";
    if (typeof node.text === "string") text = node.text;
    else if (typeof node.fullContent === "string") text = node.fullContent;
    else if (node.text && node.text.toString() !== "[object Object]") text = node.text.toString();
    return text.trim();
};

/**
 * Helper: Get children of a node
 */
const getChildren = (node) => {
    const results = [];
    if (!node) return results;
    try {
        if (node.children) {
            for (const child of node.children) results.push(child);
        }
    } catch (e) {}
    // Fallback for Linked Lists
    if (results.length === 0 && node.first) {
        let curr = node.first;
        while (curr) {
            results.push(curr);
            curr = curr.nextSibling;
        }
    }
    return results;
};

/**
 * Capture version snapshot using native Adobe cloning
 * Creates a hidden page clone and returns its ID
 * @returns {Object} - { snapshotPageId, success }
 */
export async function captureVersionSnapshot() {
    console.log("📸 VERSION CONTROL: Capturing native snapshot...");
    
    try {
        const currentPage = editor.context.currentPage;
        if (!currentPage) {
            throw new Error("No current page found");
        }

        // Clone using native Adobe API
        if (typeof currentPage.cloneInPlace === 'function') {
            const snapshotPage = currentPage.cloneInPlace();
            
            // Mark as hidden snapshot (name prefix for identification)
            const timestamp = new Date().toISOString();
            snapshotPage.name = `[SNAPSHOT] ${timestamp}`;
            
            console.log(`✅ Snapshot created: Page ID = ${snapshotPage.id}`);
            
            return {
                snapshotPageId: snapshotPage.id,
                success: true
            };
        } else {
            throw new Error("cloneInPlace API not available");
        }
    } catch (error) {
        console.error("❌ Snapshot capture failed:", error);
        return {
            snapshotPageId: null,
            success: false,
            error: error.message
        };
    }
}

/**
 * Restore version from snapshot page
 * @param {string} snapshotPageId - The ID of the snapshot page to restore
 * @returns {Object} - { success }
 */
export async function restoreVersionSnapshot(snapshotPageId) {
    console.log(`🔄 VERSION CONTROL: Restoring snapshot ${snapshotPageId}...`);
    
    try {
        // Find the snapshot page by ID
        const allPages = editor.documentRoot.pages;
        let snapshotPage = null;
        
        for (const page of allPages) {
            if (page.id === snapshotPageId) {
                snapshotPage = page;
                break;
            }
        }
        
        if (!snapshotPage) {
            throw new Error(`Snapshot page ${snapshotPageId} not found`);
        }
        
        // Clone the snapshot page
        if (typeof snapshotPage.cloneInPlace === 'function') {
            const restoredPage = snapshotPage.cloneInPlace();
            
            // Name it as restored version
            restoredPage.name = `Restored - ${new Date().toISOString()}`;
            
            // Switch to the restored page
            editor.context.currentPage = restoredPage;
            
            console.log(`✅ Version restored successfully from snapshot ${snapshotPageId}`);
            
            return { success: true };
        } else {
            throw new Error("cloneInPlace API not available");
        }
    } catch (error) {
        console.error("❌ Restoration failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Serialize the current canvas state to JSON
 * @returns {string} - JSON string of canvas state
 */
export async function serializeCanvas() {
    console.log("📝 Serializing canvas state...");
    
    try {
        const currentPage = editor.context.currentPage;
        if (!currentPage) {
            throw new Error("No current page found");
        }

        const serialized = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            page: serializePage(currentPage)
        };

        const jsonString = JSON.stringify(serialized);
        console.log(`✅ Canvas serialized: ${jsonString.length} characters`);
        
        return jsonString;
    } catch (error) {
        console.error("❌ Serialization failed:", error);
        return JSON.stringify({ error: error.message });
    }
}

/**
 * Serialize a page and its contents
 */
function serializePage(page) {
    const pageData = {
        id: page.id || null,
        name: page.name || "Untitled",
        width: page.width || 1080,
        height: page.height || 1080,
        children: []
    };

    // Get the container (artboard or page itself)
    let container = page;
    if (page.artboards && page.artboards.length > 0) {
        container = page.artboards.first;
        pageData.hasArtboard = true;
        pageData.artboardWidth = container.width;
        pageData.artboardHeight = container.height;
        
        // Serialize background
        try {
            if (container.fill) {
                pageData.background = serializeFill(container.fill);
            }
        } catch (e) {}
    }

    // Serialize all children
    const children = getChildren(container);
    for (const child of children) {
        const serializedChild = serializeNode(child);
        if (serializedChild) {
            pageData.children.push(serializedChild);
        }
    }

    return pageData;
}

/**
 * Serialize a single node
 */
function serializeNode(node) {
    if (!node) return null;

    const baseData = {
        type: node.type,
        id: node.id || null,
        translation: node.translation ? { x: node.translation.x, y: node.translation.y } : { x: 0, y: 0 },
        rotation: node.rotation || 0,
        opacity: node.opacity !== undefined ? node.opacity : 1,
        width: node.width || 0,
        height: node.height || 0
    };

    // Type-specific serialization
    switch (node.type) {
        case "Text":
            baseData.text = getTextContent(node);
            try {
                if (node.textStyle) {
                    baseData.textStyle = {
                        fontSize: node.textStyle.fontSize,
                        color: node.textStyle.color,
                        fontFamily: node.textStyle.fontFamily
                    };
                }
            } catch (e) {}
            break;

        case "Rectangle":
            try {
                if (node.fill) baseData.fill = serializeFill(node.fill);
                if (node.stroke) baseData.stroke = serializeStroke(node.stroke);
            } catch (e) {}
            break;

        case "Ellipse":
            baseData.rx = node.rx || 0;
            baseData.ry = node.ry || 0;
            try {
                if (node.fill) baseData.fill = serializeFill(node.fill);
            } catch (e) {}
            break;

        case "Group":
            baseData.children = [];
            const children = getChildren(node);
            for (const child of children) {
                const serializedChild = serializeNode(child);
                if (serializedChild) {
                    baseData.children.push(serializedChild);
                }
            }
            break;

        case "MediaContainerNode":
        case "Image":
            // Note: Can't serialize bitmap data, only metadata
            baseData.hasImage = true;
            baseData.imageNote = "Image content not serialized - restore will use placeholder";
            break;
    }

    return baseData;
}

/**
 * Helper: Serialize fill
 */
function serializeFill(fill) {
    if (!fill) return null;
    return {
        red: fill.red || 0,
        green: fill.green || 0,
        blue: fill.blue || 0,
        alpha: fill.alpha !== undefined ? fill.alpha : 1
    };
}

/**
 * Helper: Serialize stroke
 */
function serializeStroke(stroke) {
    if (!stroke) return null;
    return {
        color: serializeFill(stroke.color),
        width: stroke.width || 1
    };
}

/**
 * Restore canvas from serialized JSON state
 * @param {string} jsonString - Serialized canvas state
 * @returns {Object} - { success, message }
 */
export async function restoreFromJson(jsonString) {
    console.log("🔄 Restoring canvas from JSON...");
    
    try {
        const data = JSON.parse(jsonString);
        
        if (!data.page) {
            throw new Error("Invalid serialized data: no page data found");
        }

        console.log("📋 Parsed data:", data);

        // Clear current page instead of creating new one
        const currentPage = editor.context.currentPage;
        
        // Get the artboard or page as container
        let container = currentPage;
        if (currentPage.artboards && currentPage.artboards.length > 0) {
            container = currentPage.artboards.first;
        }

        // Clear all existing children
        console.log("🗑️ Clearing existing content...");
        const children = getChildren(container);
        for (const child of children) {
            try {
                child.removeFromParent();
            } catch (e) {
                console.warn("Failed to remove child:", e);
            }
        }

        // Restore background if it exists
        const pageData = data.page;
        if (pageData.background && container.fill !== undefined) {
            try {
                const bgFill = deserializeFill(pageData.background);
                if (bgFill) {
                    container.fill = bgFill;
                }
            } catch (e) {
                console.warn("Failed to restore background:", e);
            }
        }

        // Restore all children
        console.log(`📦 Restoring ${pageData.children?.length || 0} children...`);
        if (pageData.children && pageData.children.length > 0) {
            for (const childData of pageData.children) {
                try {
                    restoreNode(childData, container);
                } catch (e) {
                    console.error("Failed to restore child node:", e);
                }
            }
        }

        console.log(`✅ Canvas restored successfully`);
        
        return {
            success: true,
            message: "Canvas restored successfully"
        };
    } catch (error) {
        console.error("❌ Restore failed:", error);
        return {
            success: false,
            message: error.message || "Unknown error during restoration"
        };
    }
}

/**
 * Restore a single node from serialized data
 */
function restoreNode(nodeData, parent) {
    if (!nodeData) return null;

    let newNode = null;

    try {
        console.log(`🔧 Restoring node type: ${nodeData.type}`);
        
        switch (nodeData.type) {
            case "Text":
                // Create text node with content
                const textContent = nodeData.text || "Default Text";
                newNode = editor.createText(textContent);
                
                // Set text styling if available
                if (nodeData.fontSize) {
                    try {
                        newNode.fontSize = nodeData.fontSize;
                    } catch (e) {
                        console.warn("Could not set fontSize:", e);
                    }
                }
                if (nodeData.fontFamily) {
                    try {
                        newNode.fontFamily = nodeData.fontFamily;
                    } catch (e) {
                        console.warn("Could not set fontFamily:", e);
                    }
                }
                
                // Set fill color for text
                if (nodeData.fill) {
                    try {
                        const fill = deserializeFill(nodeData.fill);
                        if (fill) {
                            newNode.fill = fill;
                        }
                    } catch (e) {
                        console.warn("Could not set text fill:", e);
                    }
                }
                break;

            case "Rectangle":
                // Create rectangle with dimensions
                const rectWidth = nodeData.width || 100;
                const rectHeight = nodeData.height || 100;
                newNode = editor.createRectangle();
                newNode.width = rectWidth;
                newNode.height = rectHeight;
                
                // Set fill
                if (nodeData.fill) {
                    try {
                        const fill = deserializeFill(nodeData.fill);
                        if (fill) {
                            newNode.fill = fill;
                        }
                    } catch (e) {
                        console.warn("Could not set rectangle fill:", e);
                    }
                }
                
                // Set stroke
                if (nodeData.stroke) {
                    try {
                        const stroke = deserializeStroke(nodeData.stroke);
                        if (stroke) {
                            newNode.stroke = stroke;
                        }
                    } catch (e) {
                        console.warn("Could not set stroke:", e);
                    }
                }
                break;

            case "Ellipse":
                // Create ellipse with radii
                const rx = nodeData.rx || 50;
                const ry = nodeData.ry || 50;
                newNode = editor.createEllipse();
                newNode.rx = rx;
                newNode.ry = ry;
                
                // Set fill
                if (nodeData.fill) {
                    try {
                        const fill = deserializeFill(nodeData.fill);
                        if (fill) {
                            newNode.fill = fill;
                        }
                    } catch (e) {
                        console.warn("Could not set ellipse fill:", e);
                    }
                }
                
                // Set stroke
                if (nodeData.stroke) {
                    try {
                        const stroke = deserializeStroke(nodeData.stroke);
                        if (stroke) {
                            newNode.stroke = stroke;
                        }
                    } catch (e) {
                        console.warn("Could not set ellipse stroke:", e);
                    }
                }
                break;

            case "Group":
                // Create a group container
                console.log("Creating group with", nodeData.children?.length || 0, "children");
                newNode = editor.createGroup();
                
                // Restore children into the group
                if (nodeData.children && nodeData.children.length > 0) {
                    for (const childData of nodeData.children) {
                        try {
                            restoreNode(childData, newNode);
                        } catch (e) {
                            console.error("Failed to restore group child:", e);
                        }
                    }
                }
                break; // Continue to apply transforms

            case "MediaContainerNode":
            case "Image":
                // Create placeholder rectangle for images (images require asset URLs)
                console.warn("Image restoration not fully supported - creating placeholder");
                const imgWidth = nodeData.width || 100;
                const imgHeight = nodeData.height || 100;
                newNode = editor.createRectangle();
                newNode.width = imgWidth;
                newNode.height = imgHeight;
                
                // Gray fill to indicate it's a placeholder
                try {
                    const grayFill = editor.makeColorFill({ red: 0.8, green: 0.8, blue: 0.8, alpha: 1 });
                    newNode.fill = grayFill;
                } catch (e) {
                    console.warn("Could not set placeholder fill:", e);
                }
                break;

            default:
                console.warn(`Unknown node type: ${nodeData.type}`);
                return null;
        }

        // Add node to parent and apply common properties
        if (newNode) {
            parent.children.append(newNode);
            
            // Apply position (translation)
            if (nodeData.translation) {
                try {
                    newNode.translation = {
                        x: nodeData.translation.x || 0,
                        y: nodeData.translation.y || 0
                    };
                } catch (e) {
                    console.warn("Could not set translation:", e);
                }
            }
            
            // Apply rotation
            if (nodeData.rotation !== undefined && nodeData.rotation !== 0) {
                try {
                    newNode.rotation = nodeData.rotation;
                } catch (e) {
                    console.warn("Could not set rotation:", e);
                }
            }
            
            // Apply opacity
            if (nodeData.opacity !== undefined && nodeData.opacity !== 1) {
                try {
                    newNode.opacity = nodeData.opacity;
                } catch (e) {
                    console.warn("Could not set opacity:", e);
                }
            }

            console.log(`✅ Restored ${nodeData.type} successfully`);
        }

        return newNode;
    } catch (error) {
        console.error(`❌ Failed to restore node type ${nodeData.type}:`, error);
        return null;
    }
}

/**
 * Deserialize fill data into SDK-compatible fill object
 */
function deserializeFill(fillData) {
    if (!fillData) return null;
    
    try {
        if (fillData.type === "solid" || fillData.red !== undefined) {
            // Create color fill
            return editor.makeColorFill({
                red: fillData.red || 0,
                green: fillData.green || 0,
                blue: fillData.blue || 0,
                alpha: fillData.alpha !== undefined ? fillData.alpha : 1
            });
        }
        // Add support for gradients/patterns if needed in future
        return null;
    } catch (e) {
        console.warn("Failed to deserialize fill:", e);
        return null;
    }
}

/**
 * Deserialize stroke data into SDK-compatible stroke object
 */
function deserializeStroke(strokeData) {
    if (!strokeData) return null;
    
    try {
        const stroke = editor.makeStroke();
        
        if (strokeData.width !== undefined) {
            stroke.width = strokeData.width;
        }
        
        if (strokeData.color) {
            const color = editor.makeColorFill({
                red: strokeData.color.red || 0,
                green: strokeData.color.green || 0,
                blue: strokeData.color.blue || 0,
                alpha: strokeData.color.alpha !== undefined ? strokeData.color.alpha : 1
            });
            stroke.color = color;
        }
        
        return stroke;
    } catch (e) {
        console.warn("Failed to deserialize stroke:", e);
        return null;
    }
}

/**
 * Export current page as preview (placeholder - actual implementation depends on SDK capabilities)
 * @returns {string|null} - Preview URL or null
 */
export async function exportPreview() {
    console.log("📸 Exporting preview...");
    
    // Note: Adobe Express SDK may not have direct PNG export from Document Sandbox
    // This is a placeholder that returns null
    // In production, you might need to handle this in the UI thread
    
    return null;
}
