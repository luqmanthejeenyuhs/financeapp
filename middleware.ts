export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/oanda/:path*",
    "/api/bot/:path*",
    "/api/wallet/:path*",
    "/api/kyc/:path*",
    "/api/broker/:path*",
    "/api/admin/:path*",
  ],
};
