import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      matric?: string;
      needsRegistration: boolean;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
