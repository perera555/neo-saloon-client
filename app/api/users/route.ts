import prisma from "@/lib/prisma";
import { RequestUserType } from "@/types/requestUser";
import { getUser, isprivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";


//GET request to fetch all users
export async function GET(request: NextRequest) {
 
const havePrivilege = (await isprivileged (request, "users:read"))
if (!havePrivilege) {
  return NextResponse.json(
    {
      message: "You do not have the required privilege to access this resource.",

},
{
  status: 403,
}
  )
}
      const users = await prisma.user.findMany(
        {
            select:{
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                lastLogin: true,
                password: false,
                status: true,
                roles: true,
                privileges: true,

            }
        }
      );
      return NextResponse.json(
        {
          message: "Users fetched successfully",
          users: users,
        },
        { status: 200 },
      );
   
  }
  
  //register a new user
  export async function POST(request: NextRequest) { 

    // Check if the user has the required privilege to create a new user

    const body = await request.json();

    if(body.email == null){
      return NextResponse.json(
        {
          message: "Email is required",
        },
        { status: 400 },
      );
    }
    if(body.firstName == null){
      return NextResponse.json(
        {
          message: "First name is required",
        },
        { status: 400 },
      );
    }
    if(body.lastName == null){
      return NextResponse.json(
        {
          message: "Last name is required",
        },
        { status: 400 },
      );
    }
    if(body.password == null){
      return NextResponse.json(
        {
          message: "Password is required",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    }
  );
  if (existingUser != null) {
    return NextResponse.json(
      {
        message: "A user with this email already exists.",
      },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  await prisma.user.create({
    data:{
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: passwordHash,
      phone: body.phone,
    }
  })
  return NextResponse.json(
    {
      message: "User created successfully",
    },
    { status: 201 },
  );


  }
    
  export async function PUT(request: NextRequest) {

    const id = request.nextUrl.searchParams.get("id");

    const reqestedUser = await getUser(request);//get the user from the request(Authentication.ts)

    if(reqestedUser == null){//if the user is not authenticated
      return NextResponse.json(
        {
          message: "You are not authenticated",
        },
        { status: 401 },
      );
    }
    if(reqestedUser.id == id){//if the user is not the same as the requested user

    } else{
      const havePrivilege = (await isprivileged (request, "users:update"))
      if (!havePrivilege) {
        return NextResponse.json(
          {
            message: "You do not have the required privilege to access this resource.",   
        },
        {
          status: 403,
        }
      )
    }

    }
  }

export async function DELETE(request: NextRequest) {

}