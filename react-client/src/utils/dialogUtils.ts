// @ts-ignore
import addOnUISdk from "add-on-ui-sdk";

/**
 * Shows an information dialog (replaces alert for success messages)
 */
export const showSuccessDialog = async (message: string) => {
  try {
    await addOnUISdk.ready;
    await addOnUISdk.app.showModalDialog({
      variant: "information",
      title: "Success",
      description: message,
      buttonLabels: { primary: "OK" }
    });
  } catch (error) {
    console.error("Error showing success dialog:", error);
    // Fallback to console if dialog fails
    console.log("Success:", message);
  }
};

/**
 * Shows an error dialog (replaces alert for error messages)
 */
export const showErrorDialog = async (message: string) => {
  try {
    await addOnUISdk.ready;
    await addOnUISdk.app.showModalDialog({
      variant: "error",
      title: "Error",
      description: message,
      buttonLabels: { primary: "OK" }
    });
  } catch (error) {
    console.error("Error showing error dialog:", error);
    // Fallback to console if dialog fails
    console.error("Error:", message);
  }
};

/**
 * Shows a warning dialog (replaces alert for warning messages)
 */
export const showWarningDialog = async (message: string) => {
  try {
    await addOnUISdk.ready;
    await addOnUISdk.app.showModalDialog({
      variant: "warning",
      title: "Warning",
      description: message,
      buttonLabels: { primary: "OK" }
    });
  } catch (error) {
    console.error("Error showing warning dialog:", error);
    // Fallback to console if dialog fails
    console.warn("Warning:", message);
  }
};

/**
 * Shows an information dialog (replaces alert for informational messages)
 */
export const showInfoDialog = async (message: string) => {
  try {
    await addOnUISdk.ready;
    await addOnUISdk.app.showModalDialog({
      variant: "information",
      title: "Information",
      description: message,
      buttonLabels: { primary: "OK" }
    });
  } catch (error) {
    console.error("Error showing info dialog:", error);
    // Fallback to console if dialog fails
    console.log("Info:", message);
  }
};

/**
 * Shows a confirmation dialog (returns true if user clicks primary button)
 */
export const showConfirmDialog = async (
  title: string,
  message: string,
  primaryLabel: string = "Confirm",
  cancelLabel: string = "Cancel"
): Promise<boolean> => {
  try {
    await addOnUISdk.ready;
    const result = await addOnUISdk.app.showModalDialog({
      variant: "confirmation",
      title: title,
      description: message,
      buttonLabels: { 
        primary: primaryLabel,
        cancel: cancelLabel 
      }
    });
    return result.buttonType === "primary";
  } catch (error) {
    console.error("Error showing confirm dialog:", error);
    return false;
  }
};
