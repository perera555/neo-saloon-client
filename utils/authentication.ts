import { NextRequest } from "next/server";
import * as jose from "jose";
import { RequestUserType } from "@/types/requestUser";

 export async function getUser(request: NextRequest) : Promise<RequestUserType | null> {
        const loginToken = request.cookies.get("login-token")?.value;
        const secretText = process.env.JOSE_SECRET; // Replace with your own secret key
        const secret = new TextEncoder().encode(secretText); // Convert the secret key to a Uint8Array
    
        try{
            const tokenData  = await jose.jwtVerify(
            loginToken||"",
            secret
        )
       const user :RequestUserType = tokenData.payload as unknown as RequestUserType;
       return user
        }catch(error){
            return null; // Return null or handle the error as needed
        }
    

 }
 export  async function isprivileged(request: NextRequest, privilege: string): Promise<boolean> {
    const user: RequestUserType | null = await getUser(request);//get the user from the request(Authentication.ts)
    if (user == null) {
      return false;
    }
    if (user.privileges.includes(privilege)) {
      return true;
    }else {
      return false;
    }
}

 