// Permission manager utility - no UI components, just permission checking
export interface PermissionStatus {
  state: PermissionState;
  canRequest: boolean;
  canRetry: boolean;
  reason?: string;
}

export interface PermissionRequest {
  microphone?: boolean;
  camera?: boolean;
  screen?: boolean;
}

export class PermissionManager {
  private static instance: PermissionManager;

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Check if the browser supports the Permissions API
   */
  private isPermissionsAPISupported(): boolean {
    return 'permissions' in navigator && 'query' in navigator.permissions;
  }

  /**
   * Check current permission status for a specific permission
   */
  async checkPermission(permissionName: PermissionName): Promise<PermissionStatus> {
    if (!this.isPermissionsAPISupported()) {
      return {
        state: 'prompt',
        canRequest: true,
        canRetry: true,
        reason: 'Permissions API not supported, will prompt on use',
      };
    }

    try {
      const result = await navigator.permissions.query({ name: permissionName });
      return {
        state: result.state,
        canRequest: result.state === 'prompt',
        canRetry: result.state === 'denied',
        reason: this.getPermissionReason(result.state, permissionName),
      };
    } catch (error) {
      console.warn(`Failed to query permission ${permissionName}:`, error);
      return {
        state: 'prompt',
        canRequest: true,
        canRetry: true,
        reason: 'Unable to determine permission status, will prompt on use',
      };
    }
  }

  /**
   * Check microphone permission status
   */
  async checkMicrophonePermission(): Promise<PermissionStatus> {
    return this.checkPermission('microphone' as PermissionName);
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.warn(
          'Microphone access denied. Please enable microphone permissions in your browser settings.'
        );
      } else {
        console.warn('Failed to access microphone. Please check your device settings.');
      }
      return false;
    }
  }

  /**
   * Get a user-friendly reason for permission state
   */
  private getPermissionReason(state: PermissionState, permissionName: string): string {
    switch (state) {
      case 'granted':
        return `${permissionName} access is already enabled`;
      case 'denied':
        return `${permissionName} access was denied. You can enable it in your browser settings.`;
      case 'prompt':
        return `${permissionName} access will be requested when needed`;
      default:
        return `Unable to determine ${permissionName} permission status`;
    }
  }
}

// Export singleton instance
export const permissionManager = PermissionManager.getInstance();

// Export convenience functions
export const checkMicrophonePermission = () => permissionManager.checkMicrophonePermission();
export const requestMicrophonePermission = () => permissionManager.requestMicrophonePermission();
