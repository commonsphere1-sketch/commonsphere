import React from "react";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-6">🚧</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
      <p className="text-gray-500">This page is coming soon.</p>
    </div>
  );
}

export function NewsJournalism() { return <PlaceholderPage title="News & Journalism" />; }
export function Blog() { return <PlaceholderPage title="Blog" />; }
export function BlogPost() { return <PlaceholderPage title="Blog Post" />; }
export function Debates() { return <PlaceholderPage title="Debates" />; }
export function International() { return <PlaceholderPage title="International" />; }
export function CountryDetail() { return <PlaceholderPage title="Country Detail" />; }
export function UrbanRuralAnalysis() { return <PlaceholderPage title="Urban & Rural Analysis" />; }
export function EconomicSystemsAnalysis() { return <PlaceholderPage title="Economic Systems Analysis" />; }
export function GlobalNorthSouthAnalysis() { return <PlaceholderPage title="Global North/South Analysis" />; }
export function InternationalProjects() { return <PlaceholderPage title="International Projects" />; }
export function DataLab() { return <PlaceholderPage title="Data Lab" />; }
export function About() { return <PlaceholderPage title="About CommonSphere" />; }
export function GlobalEconomyDetail() { return <PlaceholderPage title="Economy Detail" />; }
export function Senate() { return <PlaceholderPage title="Senate" />; }
export function Congress() { return <PlaceholderPage title="Congress" />; }
export function Bookmarks() { return <PlaceholderPage title="Bookmarks" />; }
export function Collections() { return <PlaceholderPage title="Collections" />; }
export function AdminDashboard() { return <PlaceholderPage title="Admin Dashboard" />; }
export function BannerSubmission() { return <PlaceholderPage title="Advertise" />; }
export function AdminBannerManager() { return <PlaceholderPage title="Banner Manager" />; }
export function AdvertiserPortal() { return <PlaceholderPage title="Advertiser Portal" />; }
export function NonProfitTools() { return <PlaceholderPage title="Non-Profit Tools" />; }
export function AcademicTools() { return <PlaceholderPage title="Academic Tools" />; }
export function Mission() { return <PlaceholderPage title="Our Mission" />; }
export function PrivacyPolicy() { return <PlaceholderPage title="Privacy Policy" />; }
export function TermsOfService() { return <PlaceholderPage title="Terms of Service" />; }
export function DataSources() { return <PlaceholderPage title="Data Sources" />; }
export function FAQ() { return <PlaceholderPage title="FAQ" />; }
export function Glossary() { return <PlaceholderPage title="Glossary" />; }
export function HealthcareDeepDive() { return <PlaceholderPage title="Healthcare Deep Dive" />; }
export function EducationDeepDive() { return <PlaceholderPage title="Education Deep Dive" />; }
export function MultiEntityComparison() { return <PlaceholderPage title="Multi-Entity Comparison" />; }
export function PolicyAnalyticsDashboard() { return <PlaceholderPage title="Policy Analytics" />; }
export function StateDetail() { return <PlaceholderPage title="State Detail" />; }
export function PricingPage({ darkMode }: { darkMode?: boolean }) { return <PlaceholderPage title="Pricing" />; }
export function APIAccess({ darkMode }: { darkMode?: boolean }) { return <PlaceholderPage title="API Access" />; }
export function EducationalLicensing({ darkMode }: { darkMode?: boolean }) { return <PlaceholderPage title="Educational Licensing" />; }
export function WhiteLabelSolutions({ darkMode }: { darkMode?: boolean }) { return <PlaceholderPage title="White Label Solutions" />; }
export function ContactSales({ darkMode }: { darkMode?: boolean }) { return <PlaceholderPage title="Contact Sales" />; }
export function DataReports({ darkMode }: { darkMode?: boolean }) { return <PlaceholderPage title="Data Reports" />; }
export function CopyrightGuide() { return <PlaceholderPage title="Copyright Guide" />; }
export function CopyrightDownload() { return <PlaceholderPage title="Copyright Download" />; }
export function ProjectExport() { return <PlaceholderPage title="Project Export" />; }
