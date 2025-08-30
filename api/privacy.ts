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
    <title>Privacy Policy - VoteWithYourWallet</title>
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
        .intro {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 32px;
            font-style: italic;
        }
        h2 {
            color: #1e40af;
            margin-top: 32px;
            margin-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        h3 {
            color: #3730a3;
            margin-top: 24px;
            margin-bottom: 12px;
        }
        p {
            margin-bottom: 16px;
        }
        ul {
            margin: 16px 0;
            padding-left: 20px;
        }
        .highlight {
            background: #dbeafe;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
        }
        .footer {
            background: #dbeafe;
            padding: 20px;
            border-radius: 8px;
            margin-top: 32px;
            text-align: center;
            color: #1e40af;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy</h1>
        <p class="last-updated">Last Updated: ${lastUpdated}</p>
        
        <div class="intro">
            <p>At VoteWithYourWallet, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
        </div>

        <h2>1. Information We Collect</h2>
        
        <h3>Personal Information</h3>
        <p>We may collect the following personal information:</p>
        <ul>
            <li>Name and email address (for account creation)</li>
            <li>Location information (city, state, zip code)</li>
            <li>Political preferences and alignment responses</li>
            <li>Business reviews and ratings you submit</li>
            <li>Profile information you choose to provide</li>
        </ul>

        <h3>Usage Information</h3>
        <p>We automatically collect certain information about your use of our service:</p>
        <ul>
            <li>Device information (device type, operating system, browser type)</li>
            <li>Log data (IP address, access times, pages viewed)</li>
            <li>App usage patterns and interactions</li>
            <li>Search queries and business interactions</li>
            <li>Location data (if you grant permission)</li>
        </ul>

        <h3>Cookies and Tracking Technologies</h3>
        <p>We use cookies, web beacons, and similar technologies to:</p>
        <ul>
            <li>Remember your preferences and settings</li>
            <li>Analyze app usage and performance</li>
            <li>Provide personalized recommendations</li>
            <li>Improve our service functionality</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <div class="highlight">
            <p><strong>Service Provision:</strong> To provide personalized business recommendations based on your political alignment and preferences</p>
            <p><strong>Account Management:</strong> To create and maintain your user account, authenticate your identity, and provide customer support</p>
            <p><strong>Personalization:</strong> To customize your experience and show relevant businesses and content</p>
            <p><strong>Analytics:</strong> To understand how users interact with our service and improve our platform</p>
            <p><strong>Communications:</strong> To send you updates, newsletters, and important service notifications (you can opt-out anytime)</p>
            <p><strong>Research:</strong> To conduct aggregated, anonymized research on consumer behavior and political preferences</p>
        </div>

        <h2>3. Information Sharing and Disclosure</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>

        <h3>With Your Consent</h3>
        <p>We may share your information when you explicitly consent to such sharing.</p>

        <h3>Service Providers</h3>
        <p>We may share information with trusted third-party service providers who help us operate our service:</p>
        <ul>
            <li>Cloud hosting and database services</li>
            <li>Analytics and performance monitoring tools</li>
            <li>Email and communication services</li>
            <li>Payment processing (if applicable)</li>
        </ul>
        <p>These providers are contractually obligated to protect your information and use it only for the specified purposes.</p>

        <h3>Aggregated and Anonymized Data</h3>
        <p>We may share aggregated, anonymized data that cannot identify you personally for research, business intelligence, and public reporting purposes.</p>

        <h2>4. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures to protect your personal information:</p>
        <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security audits and monitoring</li>
            <li>Employee training on data protection practices</li>
        </ul>
        <p>However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.</p>

        <h2>5. Your Privacy Rights</h2>
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>

        <h3>Access and Portability</h3>
        <ul>
            <li>Request a copy of the personal information we hold about you</li>
            <li>Export your data in a machine-readable format</li>
        </ul>

        <h3>Correction and Updates</h3>
        <ul>
            <li>Update or correct inaccurate personal information</li>
            <li>Modify your political alignment preferences at any time</li>
        </ul>

        <h3>Deletion</h3>
        <ul>
            <li>Request deletion of your personal information ("right to be forgotten")</li>
            <li>Delete your account and associated data through the app settings</li>
        </ul>

        <h3>Opt-Out Rights</h3>
        <ul>
            <li>Opt-out of marketing communications</li>
            <li>Disable location tracking</li>
            <li>Opt-out of certain data collection practices</li>
        </ul>

        <h2>6. Political Data Handling</h2>
        <div class="highlight">
            <p>Given the political nature of our service, we take special care with politically-sensitive information:</p>
            <ul>
                <li>Your political alignment data is encrypted and stored securely</li>
                <li>We never share individual political preferences with third parties without explicit consent</li>
                <li>Aggregated political trends are anonymized and cannot be traced back to individuals</li>
                <li>You can modify or delete your political alignment data at any time</li>
                <li>We do not use political data for advertising purposes outside our service</li>
            </ul>
        </div>

        <h2>7. International Users</h2>
        <p>Our service is hosted in the United States. If you access our service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States.</p>
        <p>For users in the European Union, we comply with applicable data protection laws including the General Data Protection Regulation (GDPR). For users in California, we comply with the California Consumer Privacy Act (CCPA).</p>

        <h2>8. Contact Us</h2>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
        <p>Email: <a href="mailto:privacy@votewithyourwallet.com">privacy@votewithyourwallet.com</a><br>
        Website: <a href="https://votewithyourwallet.com/privacy-contact">https://votewithyourwallet.com/privacy-contact</a></p>
        <p>For EU users: You also have the right to lodge a complaint with your local data protection authority.</p>

        <div class="footer">
            <p>We are committed to protecting your privacy and being transparent about our data practices. Thank you for trusting VoteWithYourWallet with your information.</p>
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlContent);
  } else {
    // Return JSON for API consumers
    return res.status(200).json({
      title: "Privacy Policy",
      lastUpdated,
      sections: {
        introduction: "We respect your privacy and are committed to protecting your personal data.",
        dataCollection: "We collect personal information, usage data, and use cookies for service improvement.",
        dataUse: "Information is used for personalization, account management, analytics, and research.",
        dataSharing: "We do not sell personal data. Limited sharing with service providers and for legal compliance.",
        security: "We implement encryption, secure access controls, and regular security audits.",
        userRights: "You have rights to access, correct, delete, and port your personal data.",
        politicalData: "Special protections for politically-sensitive information with encryption and anonymization.",
        international: "Service hosted in US with GDPR and CCPA compliance for applicable users.",
        contact: "privacy@votewithyourwallet.com"
      }
    });
  }
}
