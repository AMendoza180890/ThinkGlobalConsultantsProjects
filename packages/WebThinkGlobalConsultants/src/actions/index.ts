import {render} from "@react-email/render";
import { defineAction } from "astro:actions";
import GithubAccessTokenEmail from "~/emails/contactEmail";
import { Resend } from "resend";
import {z} from "astro:schema";

const resend = new Resend(import.meta.env.RESEND_API_KEY_CONTACTFORM);

export const server = {
  send: defineAction({
    accept: "form",
    input: z.object({
        username: z.string(),
        organization: z.string(),
        role: z.string(),
        email: z.string().email(),
        organizationtype: z.string(),
        message: z.string().min(10).max(4000),
    }),
    handler: async ({username, organization, role, email, organizationtype, message }) => {
      //create the email content here, you can use the contactEmail component or create a new one for this specific email
      const contentEmail = GithubAccessTokenEmail({ username: username, organization: organization, role: role, email: email, organizationtype: organizationtype, message: message });
      const html = await render(contentEmail);
      const text = await render(contentEmail, { plainText: true });

      //Send email logic here
      const { data, error } = await resend.emails.send({
        from: import.meta.env.RESEND_EMAIL_FROM,
        to: [import.meta.env.RESEND_EMAIL_TO],
        subject: "New contact form submission",
        html,
        text,
      });

      if (error) {
        throw error;
      }

      return data;
    },
  }),
};
