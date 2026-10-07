import { NextRequest, NextResponse } from "next/server";
import { isprivileged } from "@/utils/authentication";

export async function GET(request: NextRequest) {
    

}

export async function POST(request: NextRequest) {

    const hasPrivilege = await isprivileged(request, "products:add");

    if(hasPrivilege){
        const body = await request.json();

        

    }else{
        return NextResponse.json({ message: "You do not have the required privilege to add products." }, { status: 403 });
    }



}   