/**
 * Navigation Events
 * Global navigation system using custom events
 */

export const navigationEvents = {
  /**
   * Navigate to project details page
   */
  navigateToProject: (projectId: string) => {
    console.log('[NavigationEvents] Dispatching navigateToProject:', projectId);
    window.dispatchEvent(new CustomEvent('navigateToProject', { 
      detail: { projectId } 
    }));
  },
  
  /**
   * Navigate to specific view
   */
  navigateToView: (view: string) => {
    console.log('[NavigationEvents] Dispatching navigateToView:', view);
    window.dispatchEvent(new CustomEvent('navigateToView', { 
      detail: { view } 
    }));
  }
};
