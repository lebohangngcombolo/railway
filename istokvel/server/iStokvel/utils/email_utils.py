from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import random
import string
from flask import current_app
import os

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email, verification_code):
    """Send verification email using the approach from SendGrid docs Step 5"""
    try:
        # Create the Mail object
        # Using the actual from_email from app config as before
        from_email_address = current_app.config.get('SENDGRID_FROM_EMAIL')
        if not from_email_address:
             print("ERROR: SENDGRID_FROM_EMAIL is not configured for sending email.")
             return False, "Sender email is not configured."

        from_email_obj = Email(from_email_address)
        subject = "Verify your iStokvel account"
        html_content = f"Your verification code is: <strong>{verification_code}</strong>" # Using HTML content
        to_emails = to_email # Documentation example uses to_emails='to@example.com'

        # Note: The SendGrid documentation example shows `to_emails='to@example.com'`
        # in the Mail constructor, which seems to be a simplified representation.
        # Based on library usage, it often expects an Email object or a list of Emails/strings/To objects.
        # Let's try with the single recipient email string as shown in the example's structure.
        # If this still causes issues, we might need to revert to passing an Email object or list.

        message = Mail(
            from_email=from_email_obj,
            to_emails=to_emails,
            subject=subject,
            html_content=html_content
        )

        # Get the API key directly from os.environ as shown in the example
        api_key = os.environ.get('SENDGRID_API_KEY')
        if not api_key:
            print("ERROR: SENDGRID_API_KEY environment variable is not set.")
            return False, "SendGrid API key environment variable is not set."

        # Initialize SendGrid client and send email
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)

        # Print response details as shown in the example
        print(f"SendGrid Response Status Code: {response.status_code}")
        print(f"SendGrid Response Body: {response.body}")
        print(f"SendGrid Response Headers: {response.headers}")

        # Check status code for success (2xx range)
        if 200 <= response.status_code < 300:
            return True, "Email sent successfully according to SendGrid response."
        else:
            print(f"SendGrid returned non-success status code: {response.status_code}")
            return False, f"SendGrid API returned status code {response.status_code}"

    except Exception as e:
        # Catch any exceptions during the process
        print(f"Error sending email via SendGrid: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, f"Exception during SendGrid email sending: {str(e)}"
