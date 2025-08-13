'use client';

import {getChainId} from "@/constants/chain";

export const TTL_NO_EXPIRY = 0;

/**
 * Function to get data from local storage if it is not expired.
 * @param {string} key - The key to retrieve the data.
 * @returns {string | null} - The data if available and not expired, otherwise null.
 */
export const getFromLocalStorage = (key: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        const cachedItem = localStorage.getItem(prefixedKey(key));
        if (cachedItem) {
            const item = JSON.parse(cachedItem);
            const now = new Date().getTime();
            if (item.expiry === TTL_NO_EXPIRY || now < item.expiry) {
                return item.data;
            }

            localStorage.removeItem(prefixedKey(key));
        }
    } catch (error) {
        console.error('Failed to get data from localStorage:', error);
    }

    return null;
}

/**
 * Function to set data in local storage with an expiration time.
 * @param {string} key - The key under which to store the data.
 * @param {string} data - The data to store.
 * @param {number} ttl - Time to live in seconds.
 */
export const setInLocalStorage = (key: string, data: string, ttl: number): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        if (ttl < 0) ttl = 0

        const item = {
            data: data,
            expiry: TTL_NO_EXPIRY
        };

        if (ttl > 0) {
            const now = new Date().getTime();
            item.expiry = now + (ttl * 1000)
        }

        localStorage.setItem(prefixedKey(key), JSON.stringify(item));

        return true;
    } catch (error) {
        console.error('Failed to set data in localStorage:', error);
    }

    return false;
}

export const removeFromLocalStorage = (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(prefixedKey(key));
    } catch (error) {
        console.error('Failed to remove data from localStorage:', error);
    }
}

export const getKeyExpiry = (key: string): Date | null => {
    if (typeof window === 'undefined') return null;

    try {
        const cachedItem = localStorage.getItem(prefixedKey(key));
        if (cachedItem) {
            const item = JSON.parse(cachedItem);
            if (item.expiry > TTL_NO_EXPIRY) {
                return new Date(item.expiry);
            }
        }
    } catch (error) {
        console.error('Failed to get data from localStorage:', error);
    }

    return null;
}

export const setKeyExpiry = (key: string, expiry: Date): boolean => {
    if (typeof window === 'undefined') return false;

   try {
       const cachedItem = localStorage.getItem(prefixedKey(key));
       if (cachedItem) {
           const item = JSON.parse(cachedItem);
           if (item) {
               item.expiry = expiry.getTime();
               localStorage.setItem(prefixedKey(key), JSON.stringify(item));

               return true;
           }
       }
   } catch (error) {
       console.error('Failed to set data in localStorage:', error);
   }

    return false;
}


const prefixedKey = (key: string): string => {
    return `1-${getChainId()}:${key}`;
}
