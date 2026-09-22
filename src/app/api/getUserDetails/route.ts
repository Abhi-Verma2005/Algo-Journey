import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request){
    try {
        const request = await req.json()
        const userId = request.id
        const userDetail = await prisma.user.findUnique({
            where:{
                id: userId
            },
            select:{
                id: true,
                username: true,
                section: true,
                individualPoints: true,
                leetcodeUsername: true,
                codeforcesUsername: true,
                groups: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        })
        console.log(userDetail)
        if(!userDetail) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json({ userDetail }, { status: 200 })
    } catch (error) {
        console.log('Error in getUserDetails: ', error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

}