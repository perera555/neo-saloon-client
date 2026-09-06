import { NextRequest } from "next/server";
import * as jose from "jose";

 export async function getUser(request: NextRequest) {
        const loginToken = request.cookies.get("login-token")?.value;
        const secretText = process.env.JOSE_SECRET; // Replace with your own secret key
        const secret = new TextEncoder().encode(secretText); // Convert the secret key to a Uint8Array
    
        try{
            const user = await jose.jwtVerify(
            loginToken||"",
            secret
        )
        return user.payload; // Return the decoded payload containing user information

        }catch(error){
            return null; // Return null or handle the error as needed
        }
    

 }