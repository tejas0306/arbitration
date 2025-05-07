export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-6 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">ADDS Legal AI LLP</h3>
            <p className="text-sm text-indigo-200">
              Providing innovative legal AI solutions for arbitration and dispute resolution.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="text-sm text-indigo-200 space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Subscription Packages
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact</h3>
            <p className="text-sm text-indigo-200">
              Email: info@addslegalai.com
              <br />
              Phone: +91 XXXX XXXX XX
              <br />
              Website: www.addslegalai.com
            </p>
          </div>
        </div>
        <div className="border-t border-indigo-800 mt-6 pt-6 text-center text-xs text-indigo-300">
          <p>© {new Date().getFullYear()} ADDS Legal AI LLP. All rights reserved.</p>
          <p className="mt-1">CONFIDENTIAL DOCUMENT - This information is protected by confidentiality agreements.</p>
        </div>
      </div>
    </footer>
  )
}
