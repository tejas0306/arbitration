export const emailTemplates = {
  // Part 2h: Stakeholder communication after petitioner submission
  petitionerSubmission: {
    subject: 'Arbitration Case #{caseNumber} - Petition Submitted Successfully',
    toClaimant: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Petition Submitted Successfully</h2>
        <p>Dear {claimantName},</p>
        <p>Your arbitration petition has been successfully submitted.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <h3>Case Details:</h3>
          <p><strong>Case Number:</strong> {caseNumber}</p>
          <p><strong>Submission Date:</strong> {submissionDate}</p>
          <p><strong>Status:</strong> Petition Under Review</p>
        </div>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Your case is being reviewed by our team</li>
          <li>Respondent will be notified within 24-48 hours</li>
          <li>You will receive updates via email</li>
        </ol>
        
        <p>You can track your case status at: <a href="{frontendUrl}/dashboard">Dashboard</a></p>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `,
    
    toRespondent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Notice of Arbitration Case Filed Against You</h2>
        <p>Dear {respondentName},</p>
        <p>An arbitration case has been filed against you. You are required to respond within the specified timeframe.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Case Information:</h3>
          <p><strong>Case Number:</strong> {caseNumber}</p>
          <p><strong>Claimant:</strong> {claimantName}</p>
          <p><strong>Filed Date:</strong> {submissionDate}</p>
          <p><strong>Response Deadline:</strong> {responseDeadline}</p>
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0;">
          <h3>How to Respond:</h3>
          <p>Click the link below to view the case details and submit your response:</p>
          <a href="{respondentUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
            View Case & Respond
          </a>
          <p><strong>Case Access Code:</strong> {accessCode}</p>
        </div>
        
        <p><strong>Important:</strong> Failure to respond within the deadline may result in a default judgment.</p>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `,
    
    toAdmin: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Arbitration Case Submitted</h2>
        <p>A new arbitration case has been submitted and requires review.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
          <h3>Case Summary:</h3>
          <p><strong>Case Number:</strong> {caseNumber}</p>
          <p><strong>Claimant:</strong> {claimantName}</p>
          <p><strong>Respondent:</strong> {respondentName}</p>
          <p><strong>Dispute Value:</strong> {disputeValue}</p>
          <p><strong>Submission Date:</strong> {submissionDate}</p>
        </div>
        
        <a href="{adminUrl}/cases/{caseId}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Review Case
        </a>
        
        <p>Arbitration Portal System</p>
      </div>
    `
  },

  // Part 3e: Communication after respondent submission
  respondentSubmission: {
    subject: 'Arbitration Case #{caseNumber} - Respondent Response Received',
    toRespondent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Response Submitted Successfully</h2>
        <p>Dear {respondentName},</p>
        <p>Your response to arbitration case #{caseNumber} has been successfully submitted.</p>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0;">
          <h3>What Happens Next:</h3>
          <ol>
            <li>The claimant will be notified of your response</li>
            <li>They will have {counterResponseDays} days to provide a counter-response</li>
            <li>You will be notified of any updates</li>
          </ol>
        </div>
        
        <p>You can track the case status at: <a href="{frontendUrl}/respondent/dashboard">Your Dashboard</a></p>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `,
    
    toClaimant: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Respondent Has Submitted Their Response</h2>
        <p>Dear {claimantName},</p>
        <p>The respondent has submitted their response to your arbitration case #{caseNumber}.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Action Required:</h3>
          <p>You now have {counterResponseDays} days to review the respondent's response and submit your counter-response.</p>
          <p><strong>Deadline:</strong> {counterResponseDeadline}</p>
        </div>
        
        <a href="{claimantUrl}/cases/{caseId}/counter-response" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Review & Submit Counter-Response
        </a>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `
  },

  // Part 4d: Communication after petitioner counter-response
  counterResponseSubmission: {
    subject: 'Arbitration Case #{caseNumber} - All Responses Received - Ready for Arbitration',
    toAll: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Case Ready for Arbitration</h2>
        <p>Dear {recipientName},</p>
        <p>All responses have been received for arbitration case #{caseNumber}. The case is now ready for arbitrator assignment and proceedings.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; margin: 20px 0;">
          <h3>Case Status:</h3>
          <p><strong>Status:</strong> Ready for Arbitration</p>
          <p><strong>Next Step:</strong> Arbitrator Assignment</p>
          <p><strong>Expected Timeline:</strong> 5-7 business days</p>
        </div>
        
        <h3>Summary of Submissions:</h3>
        <ul>
          <li>✓ Initial Petition by Claimant</li>
          <li>✓ Response by Respondent</li>
          <li>✓ Counter-Response by Claimant</li>
        </ul>
        
        <p>You will be notified once an arbitrator is assigned and hearing dates are scheduled.</p>
        
        <a href="{frontendUrl}/cases/{caseId}/summary" style="background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Case Summary
        </a>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `
  },

  // Case access link for respondents
  caseAccess: {
    subject: 'Access Your Arbitration Case #{caseNumber}',
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Case Access Information</h2>
        <p>Dear {recipientName},</p>
        <p>You can access arbitration case #{caseNumber} using the link below:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; text-align: center;">
          <a href="{caseUrl}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
            Access Case #{caseNumber}
          </a>
          <p style="margin-top: 15px;"><strong>Access Code:</strong> {accessCode}</p>
        </div>
        
        <p><strong>Note:</strong> This link is unique to you and should not be shared with others.</p>
        
        <p>Best regards,<br>Arbitration Portal Team</p>
      </div>
    `
  }
};

export const generateEmailContent = (template: string, data: Record<string, any>): string => {
  let content = template;
  
  // Replace all placeholders with actual data
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    content = content.replace(new RegExp(placeholder, 'g'), data[key] || '');
  });
  
  return content;
};
