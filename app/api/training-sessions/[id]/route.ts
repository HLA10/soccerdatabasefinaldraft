import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete related parts first
    await prisma.trainingSessionPart.deleteMany({
      where: { trainingSessionId: id },
    });

    // Delete the training session
    await prisma.trainingSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Training session deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting training session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete training session" },
      { status: 500 }
    );
  }
}


