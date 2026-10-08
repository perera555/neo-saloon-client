import { MediaType, ProductStatus } from "@/app/generated/prisma/enums";
import z from "zod";

const ProductStatusEnum = z.enum(ProductStatus);
const MediaTypeEnum = z.enum(MediaType);
export const MediaArraySchema = z.array(
  z.object({
    url: z.url(),
    type: MediaTypeEnum,
  }),
);

const ProductUpdateRequestSchema = z.object({
    sku: z.string().max(50).optional(),
    name: z.string().max(100).optional(),
    altNames: z.array(z.string().max(100)).optional(),
    description: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    status: ProductStatusEnum.optional(),
    price: z.number().min(0).optional(),
    compareAt: z.number().min(0).optional(),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    media: MediaArraySchema.optional()
  })
 

export type ProductUpdateRequest = z.infer<typeof ProductUpdateRequestSchema>;

export default ProductUpdateRequestSchema;
