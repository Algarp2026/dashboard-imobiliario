"use strict";

const COOKIE_NAME = "tv_commercial_access";

module.exports = function logout(request, response) {
  const secure = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(request.headers.host || "") ? "" : "; Secure";
  response.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
  );
  return response.redirect(302, "/access.html");
};
