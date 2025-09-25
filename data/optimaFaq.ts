export type FAQAnswersMap = Record<string, string>;

export type FAQSection = {
  title: string;
  buttons: string[];
  answers: FAQAnswersMap;
};

export type FAQConfig = {
  welcome: {
    message: string;
    buttons: string[];
  };
  sections: Record<string, FAQSection>;
};

const faqConfig: FAQConfig = {
  welcome: {
    message: "👋 Welcome to Optima Bank Help Center! Choose a topic:",
    buttons: [
      "About Optima Bank",
      "Account & Login",
      "Transactions & Services",
      "Voucher & Rewards",
      "Contact Support",
    ],
  },
  sections: {
    "About Optima Bank": {
      title: "About Optima Bank",
      buttons: [
        "What is Optima Bank?",
        "How do I sign up?",
        "Is it free to use?",
      ],
      answers: {
        "What is Optima Bank?":
          "Optima Bank is a digital banking web application that allows you to manage your account, transfer funds, and track transactions online.",
        "How do I sign up?":
          "Go to the Sign Up page, fill in your details, and create your account securely.",
        "Is it free to use?":
          "Yes, registration is free. Standard banking charges may apply for certain transactions.",
      },
    },
    "Account & Login": {
      title: "Account & Login",
      buttons: [
        "How do I reset my password?",
        "How do I update my profile?",
        "How do I keep my account secure?",
      ],
      answers: {
        "How do I reset my password?":
          "Click on the 'Forgot Password' link on the login page and follow the steps to reset your password.",
        "How do I update my profile?": "Log in, go to 'Profile', and edit your details anytime.",
        "How do I keep my account secure?":
          "Your account uses secure authentication and encrypted connections to protect your data.",
      },
    },
    "Transactions & Services": {
      title: "Transactions & Services",
      buttons: [
        "How can I check my account balance?",
        "How do I transfer money?",
        "Where can I see my transaction history?",
      ],
      answers: {
        "How can I check my account balance?":
          "After logging in, your balance appears on the dashboard.",
        "How do I transfer money?":
          "Go to 'Transfer', enter the recipient’s details, and confirm the transaction.",
        "Where can I see my transaction history?":
          "Open 'Transaction History' on your dashboard to review past transfers and payments.",
      },
    },
    "Voucher & Rewards": {
      title: "Voucher & Rewards",
      buttons: [
        "How to earn points",
        "How to redeem vouchers",
        "Voucher expiry date",
        "Can vouchers be transferred?",
        "What if I cancel/refund a purchase?",
      ],
      answers: {
        "How to earn points":
          "Points are earned through eligible purchases, activities, or promotions.",
        "How to redeem vouchers":
          "Vouchers can only be redeemed on the official Optima Bank app, website, or store. Points are deducted immediately after redemption.",
        "Voucher expiry date":
          "Vouchers expire on the date shown. Expired vouchers cannot be extended.",
        "Can vouchers be transferred?":
          "No, vouchers are not transferable, refundable, or exchangeable for cash/credit.",
        "What if I cancel/refund a purchase?":
          "Cancelled/refunded transactions will not return points. Vouchers may be revoked for fraud, abuse, or misuse.",
      },
    },
    "Contact Support": {
      title: "Contact Support",
      buttons: [
        "What are your working hours?",
        "How can I contact support?",
      ],
      answers: {
        "What are your working hours?":
          "Our customer service is available Monday to Friday, 9:00 AM – 6:00 PM.",
        "How can I contact support?":
          "Email support@optimabank.com or use the 'Contact Us' form on our website.",
      },
    },
  },
};

export default faqConfig;


