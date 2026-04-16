import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";

interface SendEmailNotificationProps {
    userId: string;
    title: string;
    message: string;
}

export const sendEmailNotification = async ({
    userId,
    title,
    message
}: SendEmailNotificationProps) => {
    try {
        const { messaging } = await createAdminClient();

        await messaging.createEmail(
            ID.unique(),
            title,
            message,
            [],
            [userId]
        );
    } catch (error) {
        console.error("Failed to send email notification:", error);
    }
};
