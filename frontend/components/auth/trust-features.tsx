import { Shield, Headphones, Star } from "lucide-react";

function TrustFeatures() {
  const features = [
    { icon: Shield, label: "Secure Login" },
    { icon: Headphones, label: "24/7 Support" },
    { icon: Star, label: "Trusted Platform" },
  ];

  return (
    <div className="flex items-center gap-6 text-sm text-gray-300">
      {features.map((f) => (
        <div key={f.label} className="flex items-center gap-2">
          <f.icon size={16} className="text-amber-400" />
          <span>{f.label}</span>
        </div>
      ))}
    </div>
  );
}

export { TrustFeatures };
