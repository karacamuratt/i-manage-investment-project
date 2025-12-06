import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class UserType {
    @Field(() => ID)
    id: string;

    @Field()
    email: string;

    @Field({ nullable: true })
    firstName: string;

    @Field({ nullable: true })
    lastName: string;
    
    @Field()
    createdAt: Date; 
}
