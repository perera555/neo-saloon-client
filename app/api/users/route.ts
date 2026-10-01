import prisma from "@/lib/prisma";
import { RequestUserType } from "@/types/requestUser";
import { getUser, isprivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

//GET request to fetch all users
export async function GET(request: NextRequest) {
  const havePrivilege = await isprivileged(request, "users:read");

  if (!havePrivilege) {
    return NextResponse.json(
      {
        message:
          "You do not have the required privilege to access this resource.",
      },
      {
        status: 403,
      },
    );
  }

  //pagination
  const pageNumberInString =
    request.nextUrl.searchParams.get("pageNumber") || "1";
  const pageSizeInString = request.nextUrl.searchParams.get("pageSize") || "10";

  const pageNumber = parseInt(pageNumberInString);

  const pageSize = parseInt(pageSizeInString);

  const usersCount = await prisma.user.count(); //get the total number of users.

  const totalPages = Math.ceil(usersCount / pageSize); //calculate the total number of pages.

  //check if the page number is greater than the total number of pages.
  if (pageNumber > totalPages) {
    return NextResponse.json(
      {
        message: "Page number exceeds total pages.",
        totalPages: totalPages,
      },
      { status: 400 },
    );
  }

  const users = await prisma.user.findMany({
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      privileges: true,
      password: false,
      createdAt: true,
      status: true,
      lastLogin: true,
    },
  });
  return NextResponse.json(
    {
      message: "Users fetched successfully",
      users: users,
      pagination: {
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: totalPages,
        totalCount: usersCount,
      },
    },
    { status: 200 },
  );
}

//register a new user
export async function POST(request: NextRequest) {
  // Check if the user has the required privilege to create a new user

  const body = await request.json();

  if (body.email == null) {
    return NextResponse.json(
      {
        message: "Email is required",
      },
      { status: 400 },
    );
  }
  if (body.firstName == null) {
    return NextResponse.json(
      {
        message: "First name is required",
      },
      { status: 400 },
    );
  }
  if (body.lastName == null) {
    return NextResponse.json(
      {
        message: "Last name is required",
      },
      { status: 400 },
    );
  }
  if (body.password == null) {
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
  });
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
    data: {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: passwordHash,
      phone: body.phone,
    },
  });
  return NextResponse.json(
    {
      message: "User created successfully",
    },
    { status: 201 },
  );
}

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  const reqestedUser = await getUser(request); //get the user from the request(Authentication.ts)

  if (reqestedUser == null) {
    //if the user is not authenticated
    return NextResponse.json(
      {
        message: "You are not authenticated",
      },
      { status: 401 },
    );
  }

  const body = await request.json();

  if (reqestedUser.id == id) {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (user == null) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        { status: 404 },
      );
    }

    await prisma.user.update({//update the user in the database cannot vhange all the fields of the user only the fields that are allowed to be changed by the user
      where: {
        id: id,
      },
      data: {
        firstName: body.firstName || user.firstName,
        lastName: body.lastName || user.lastName,
        phone: body.phone || user.phone,
        profileImage: body.profileImage || user.profileImage,
      },
    });
    return NextResponse.json(
      {
        message: "User updated successfully",
      },
      { status: 200 },
    );
  } else {
    const havePrivilege = await isprivileged(request, "users:edit");
    if (!havePrivilege) {
      return NextResponse.json(
        {
          message:
            "You do not have the required privilege to access this resource.",
        },
        {
          status: 403,
        },
      );
    }
    const user = await prisma.user.findUnique({
      where: {
        id: id || "0000",
      },
    });
    if (user == null) {
      return NextResponse.json(
        {
          message: "User not found",
        },
        { status: 404 },
      );
    }
    await prisma.user.update({
      //update the user in the database
      where: {
        id: id || "0000", //no access to id change
      },
      data: {
        email: body.email || user.email,
        firstName: body.firstName || user.firstName,
        lastName: body.lastName || user.lastName,
        phone: body.phone || user.phone,
        profileImage: body.profileImage || user.profileImage,
        role: body.role || user.role,
        privileges: body.privileges || user.privileges,
        status: body.status || user.status,
      },
    });
    return NextResponse.json(
      {
        message: "User updated successfully",
      },
      { status: 200 },
    );
  }
}
