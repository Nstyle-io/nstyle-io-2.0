import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { analytics } from './config';

export class FirebaseAnalyticsService {
  // Log custom events
  static logEvent(eventName: string, parameters?: Record<string, any>) {
    if (analytics) {
      logEvent(analytics, eventName, parameters);
    }
  }

  // Set user properties
  static setUserProperties(properties: Record<string, string>) {
    if (analytics) {
      setUserProperties(analytics, properties);
    }
  }

  // Set user ID
  static setUserId(userId: string) {
    if (analytics) {
      setUserId(analytics, userId);
    }
  }

  // Common event tracking methods
  static trackPageView(pageName: string, pageTitle?: string) {
    this.logEvent('page_view', {
      page_name: pageName,
      page_title: pageTitle || pageName
    });
  }

  static trackUserSignup(method: string) {
    this.logEvent('sign_up', {
      method
    });
  }

  static trackLogin(method: string) {
    this.logEvent('login', {
      method
    });
  }

  static trackPurchase(transactionId: string, value: number, currency = 'USD') {
    this.logEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency
    });
  }

  static trackSearch(searchTerm: string) {
    this.logEvent('search', {
      search_term: searchTerm
    });
  }

  static trackShare(contentType: string, contentId: string) {
    this.logEvent('share', {
      content_type: contentType,
      content_id: contentId
    });
  }
}