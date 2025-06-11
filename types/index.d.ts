// Type definitions for js-cookie

declare module 'js-cookie' {
  interface CookieAttributes {
    path?: string;
    domain?: string;
    expires?: number | Date;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }

  interface CookiesStatic {
    /**
     * Create a cookie
     */
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    
    /**
     * Read cookie
     */
    get(name: string): string | undefined;
    
    /**
     * Read all available cookies
     */
    get(): {[key: string]: string};
    
    /**
     * Delete cookie
     */
    remove(name: string, options?: CookieAttributes): void;
    
    /**
     * Get Cookies.withConverter() instance
     */
    withConverter(converter: {
      read(value: string): string;
      write(value: string): string;
    }): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
} 