import type { Staff } from '$lib/api/admin/contract';

declare global {
  namespace App {
    interface Locals {
      adminStaff?: Promise<Staff | null>;
    }
  }
}
export {};
