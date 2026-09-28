import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function POST(request: NextRequest) {
  const body = await request.json(); //this is body
  // Check if the email is null and return early if it is //
  if (body.email == null) {
    return NextResponse.json(
      {
        message: "Email is required",
      },
      { status: 400 },
    );
  }
  if (body.password == null) {
    return NextResponse.json(
      { message: "Password is required" },
      { status: 400 },
    );
  }
  //user table find first method to check if the user exists in the database// // this is database user Table
  const user = await prisma.user.findFirst({
    //find the user from database
    //where clause to find the user by email//
    where: {
      email: body.email,
    },
  });

  //if the user is not found return a 404 error// // this is database user table
  if (user == null) {
    return NextResponse.json(
      {
        message: "User not found",
      },
      { status: 404 },
    );
  }
  //baned or not active client check if the user is active or not if not return a 403 error
  if (user.status != "ACTIVE") {
    return NextResponse.json(
      {
        message: "User account is not active. please contact administrator.",
      },
      { status: 403 },
    );
  }

  const ispasswordValid = await compare(body.password, user.password);
  if (ispasswordValid) {
    await prisma.user.update(
      //update the last login date of the user in the database
      {
        where: {
          id: user.id,
        },
        data: {
          lastLogin: new Date(),
        },
      },
    );
    //if password corred create a token ang give permission to login
    const secretText = process.env.JOSE_SECRET; // Replace with your own secret key
    const secret = new TextEncoder().encode(secretText); // Convert the secret key to a Uint8Array
    // Create a JWT token with user information and sign it with the secret key

    const token = await new jose.SignJWT({
      //this is the payload of the token
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      privileges: user.privileges,
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);
    // nead response use variable to send the response back to the client with the token and user role
    const response = NextResponse.json({
      //this is the response of the login request
      message: "Login successful",
      role: user.role,
    });
    // Set the token as a cookie in the response
    response.cookies.set({
      name: "login-token",
      value: token,
      httpOnly: true,
      secure: false, // Set to true in production for HTTPS
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  } else {
    return NextResponse.json(
      {
        message: "Invalid password",
      },
      { status: 401 },
    );
  }
}
