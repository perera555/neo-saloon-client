import {z} from "zod";

const userRegistrationRequestSchema = z.object(
    {
        email : z.email(),
        firstName : z.string().max(10),
        lastName : z.string().max(10),
        password : z.string(),
        privilege : z.never().optional(),
        phone : z.string().optional(),
        
    }
)


export type UserRegistrationRequest = z.infer<typeof userRegistrationRequestSchema>

export {userRegistrationRequestSchema}