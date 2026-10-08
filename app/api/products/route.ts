import { NextRequest, NextResponse } from "next/server";
import { isprivileged } from "@/utils/authentication";
import ProductCreationRequestSchema from "@/types/dto/ProductCtreationRequest";
import z from "zod";
import prisma from "@/lib/prisma";
import getPageInfo from "@/utils/pageInfoRetrivel";
import { da } from "zod/locales";
import { ProductStatus } from "@/app/generated/prisma/enums";
import ProductUpdateRequestSchema, {
  MediaArraySchema,
} from "@/types/dto/ProductUpdateRequest";

export async function GET(request: NextRequest) {
  //pagination
  const params = getPageInfo(request); //get the pagination parameters from the request

  const hasPriviledge = await isprivileged(request, "product:read");
  if (hasPriviledge) {
    const totalProducts = await prisma.product.count(
      //All product except Deleted
      {
        where: {
          NOT: {
            status: ProductStatus.DELETED,
          },
        },
      },
    );
    const totalPages = Math.ceil(totalProducts / params.pageSize); //calculate the total number of pages.

    const products = await prisma.product.findMany({
      skip: (params.pageNumber - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        media: true,
      },
      where: {
        NOT: {
          status: ProductStatus.DELETED,
        },
      },
    });
   
  } else {
    const totalProducts = await prisma.product.count({
      where: {
        status: ProductStatus.ACTIVE,
      },
    });
    const totalPages = Math.ceil(totalProducts / params.pageSize); //calculate the total number of pages.

    const products = await prisma.product.findMany({
      skip: (params.pageNumber - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        media: true,
      },
      where: {
        status: ProductStatus.ACTIVE,
      },
    });
     return NextResponse.json(
      {
        message: "Products fetched successfully",
        products: products,
        pagination: {
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
          totalPages: totalPages,
          totalCount: totalProducts,
        },
      },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Check if the user has the required privilege to add products
  const hasPrivilege = await isprivileged(request, "products:add");

  if (hasPrivilege) {
    try {
      const body = await request.json();

      const parsedBody = ProductCreationRequestSchema.parse(body);

      await prisma.product.create({
        data: {
          sku: parsedBody.sku,
          name: parsedBody.name,
          altNames: parsedBody.altNames,
          description: parsedBody.description,
          stock: parsedBody.stock,
          status: parsedBody.status,
          price: parsedBody.price,
          compareAt: parsedBody.compareAt,
          brand: parsedBody.brand,
          model: parsedBody.model,
          media: {
            create: parsedBody.media,
          },
        },
      });
      return NextResponse.json(
        {
          message: "Product created successfully.",
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            message: error.issues[0]?.message ?? "Invalid user data provided.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          message: "Internal server error.",
        },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { message: "You do not have the required privilege to add products." },
      { status: 403 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const hasPrivilege = await isprivileged(request, "products:delete");

  if (!hasPrivilege) {
    return NextResponse.json(
      { message: "You do not have the required privilege to delete products." },
      { status: 403 },
    );
  }
  const id = request.nextUrl.searchParams.get("id");

  if (id == null) {
    return NextResponse.json(
      { message: "Product ID is required." },
      { status: 400 },
    );
  }

  try {
    // Check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });

    if (existingProduct == null) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 },
      );
    }

    await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        status: ProductStatus.DELETED, // Assuming you have a ProductStatusEnum defined somewhere
      },
    });
    return NextResponse.json(
      { message: "Product deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const hasPrivilege = await isprivileged(request, "products:edit");

  if (!hasPrivilege) {
    return NextResponse.json(
      { message: "You do not have the required privilege to edit products." },
      { status: 403 },
    );
  }
  const id = request.nextUrl.searchParams.get("id");

  if (id == null) {
    return NextResponse.json(
      { message: "Product ID is required." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    const parsedBody = ProductUpdateRequestSchema.parse(body);

    // Check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });
    if (existingProduct == null) {
      return NextResponse.json(
        {
          message: "Product not Found",
        },
        {
          status: 404,
        },
      );
    }
    if(existingProduct.status == ProductStatus.DELETED){
       return NextResponse.json(
        {
          message: "Product not Found",
        },
        {
          status: 404,
        },
      );

    }
    await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        sku: parsedBody.sku || existingProduct.sku,
        name: parsedBody.name || existingProduct.name,
        altNames: parsedBody.altNames || existingProduct.altNames,
        description: parsedBody.description || existingProduct.description,
        stock: parsedBody.stock || existingProduct.stock,
        status: parsedBody.status || existingProduct.status,
        price: parsedBody.price || existingProduct.price,
        compareAt: parsedBody.compareAt || existingProduct.compareAt,
        brand: parsedBody.brand || existingProduct.brand,
        model: parsedBody.model || existingProduct.model,
      },
    });

    if (parsedBody.media != null && parsedBody.media.length > 0) {

      const parseMediaArray = MediaArraySchema.parse(parsedBody.media);

      await prisma.media.deleteMany({
        where: {
          productId: id,
        },
      });

      await prisma.product.update({
        where: {
          id: id,
        },
        data: {
          media: {
            create: parseMediaArray,
          },
        },
      });
    }
    return NextResponse.json(
      {
        message: "Product Updated Succesfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: error.issues[0]?.message ?? "Invalid input.",
        },
        {
          status: 400,
        },
      );
    }
 console.error(error)
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
