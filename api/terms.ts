import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lastUpdated = "January 2024";

  // Return HTML for web browsers or JSON for API consumers
  const acceptHeader = req.headers.accept || '';
  
  if (acceptHeader.includes('text/html')) {
    // Return HTML page
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - VoteWithYourWallet</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            text-align: center;
            margin-bottom: 8px;
        }
        .last-updated {
            text-align: center;
            color: #666;
            font-style: italic;
            margin-bottom: 32px;
        }
        h2 {
            color: #1e40af;
            margin-top: 32px;
            margin-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        p {
            margin-bottom: 16px;
        }
        ul {
            margin: 16px 0;
            padding-left: 20px;
        }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-top: 32px;
            text-align: center;
            font-style: italic;
            color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Terms of Service</h1>
        <p class="last-updated">Last Updated: ${lastUpdated}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using VoteWithYourWallet ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>

        <h2>2. Description of Service</h2>
        <p>VoteWithYourWallet is a platform that helps users discover businesses that align with their personal values and political preferences. We provide information about businesses' political donations, stances, and activities to help users make informed consumer choices.</p>

        <h2>3. User Responsibilities</h2>
        <p>Users are responsible for:</p>
        <ul>
            <li>Providing accurate information when creating accounts</li>
            <li>Using the service in compliance with all applicable laws</li>
            <li>Not attempting to harm, hack, or disrupt the service</li>
            <li>Respecting the privacy and rights of other users</li>
            <li>Not sharing account credentials with others</li>
        </ul>

        <h2>4. Data and Information</h2>
        <p>The political alignment and business information provided by VoteWithYourWallet is compiled from publicly available sources including:</p>
        <ul>
            <li>Federal Election Commission (FEC) records</li>
            <li>Public corporate statements and press releases</li>
            <li>News reports and verified media sources</li>
            <li>User-contributed information (verified when possible)</li>
        </ul>
        <p>While we strive for accuracy, we cannot guarantee the completeness or absolute accuracy of all information.</p>

        <h2>5. User-Generated Content</h2>
        <p>By submitting reviews, ratings, or other content to the Service, you grant VoteWithYourWallet a non-exclusive, worldwide, royalty-free license to use, modify, and display such content in connection with the Service. You retain ownership of your content and may request its removal at any time.</p>

        <h2>6. Privacy and Data Protection</h2>
        <p>Your privacy is important to us. Our collection and use of personal information is governed by our <a href="/api/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as outlined in the Privacy Policy.</p>

        <h2>7. Intellectual Property</h2>
        <p>The Service and its original content, features, and functionality are owned by VoteWithYourWallet and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>

        <h2>8. Disclaimers</h2>
        <p>VoteWithYourWallet is provided "as is" and "as available" without any representations or warranties, express or implied. We do not warrant that:</p>
        <ul>
            <li>The service will be uninterrupted or error-free</li>
            <li>All information provided is current or accurate</li>
            <li>The service will meet your specific requirements</li>
            <li>Any defects will be corrected</li>
        </ul>

        <h2>9. Limitation of Liability</h2>
        <p>In no event shall VoteWithYourWallet, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.</p>

        <h2>10. Political Neutrality Disclaimer</h2>
        <p>VoteWithYourWallet aims to provide factual information to help users make informed decisions based on their personal values. We do not endorse any particular political party, candidate, or ideology. The platform is designed to serve users across the political spectrum by providing transparent information about business practices and political activities.</p>

        <h2>11. Termination</h2>
        <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.</p>

        <h2>12. Changes to Terms</h2>
        <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

        <h2>13. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of the United States and the State of California, without regard to its conflict of law provisions.</p>

        <h2>14. Contact Information</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <p>Email: <a href="mailto:legal@votewithyourwallet.com">legal@votewithyourwallet.com</a><br>
        Website: <a href="https://votewithyourwallet.com/contact">https://votewithyourwallet.com/contact</a></p>

        <div class="footer">
            <p>By continuing to use VoteWithYourWallet, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlContent);
  } else {
    // Return JSON for API consumers
    return res.status(200).json({
      title: "Terms of Service",
      lastUpdated,
      sections: {
        acceptance: "By accessing and using VoteWithYourWallet, you accept and agree to be bound by these terms.",
        service: "VoteWithYourWallet helps users discover businesses that align with their personal values and political preferences.",
        responsibilities: "Users must provide accurate information, comply with laws, and respect other users.",
        data: "Information is compiled from public sources including FEC records, corporate statements, and verified media.",
        privacy: "Data collection and use is governed by our Privacy Policy.",
        disclaimer: "Service is provided 'as is' without warranties.",
        liability: "VoteWithYourWallet is not liable for indirect or consequential damages.",
        contact: "legal@votewithyourwallet.com"
      }
    });
  }
}
