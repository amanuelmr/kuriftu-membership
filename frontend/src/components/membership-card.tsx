import Image from "next/image"
import { Award } from "lucide-react"

interface MembershipCardProps {
  name: string
  memberId: string
  tier: "Basic" | "Golden" | "Platinum" | "Diamond"
  since: string
  expiryDate: string
}

export function MembershipCard({ name, memberId, tier, since, expiryDate }: MembershipCardProps) {
  const tierColors = {
    Basic: {
      bg: "bg-gradient-to-r from-neutral-500 to-neutral-600",
      border: "border-neutral-300",
      text: "text-white",
      icon: "text-white",
    },
    Golden: {
      bg: "bg-gradient-to-r from-amber-500 to-yellow-500",
      border: "border-amber-300",
      text: "text-amber-950",
      icon: "text-amber-950",
    },
    Platinum: {
      bg: "bg-gradient-to-r from-slate-400 to-slate-500",
      border: "border-slate-300",
      text: "text-slate-950",
      icon: "text-slate-950",
    },
    Diamond: {
      bg: "bg-gradient-to-r from-purple-500 to-violet-600",
      border: "border-purple-300",
      text: "text-white",
      icon: "text-white",
    },
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${tierColors[tier].bg} ${tierColors[tier].border} border shadow-lg p-6 w-full max-w-2xl mx-auto`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-12 -mr-12 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -mb-12 -ml-12 opacity-50"></div>

      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Kuriftu Resort Logo" width={40} height={40} className="h-12 w-auto" />
          <div>
            <h3 className={`font-serif text-xl font-bold ${tierColors[tier].text}`}>Kuriftu Resort</h3>
            <p className={`text-sm ${tierColors[tier].text} opacity-80`}>Membership Card</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Award className={`h-6 w-6 ${tierColors[tier].icon}`} />
          <span className={`font-bold ${tierColors[tier].text}`}>{tier}</span>
        </div>
      </div>

      <div className="mb-6">
        <p className={`text-sm ${tierColors[tier].text} opacity-80`}>Member Name</p>
        <h3 className={`text-xl font-bold ${tierColors[tier].text}`}>{name}</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className={`text-xs ${tierColors[tier].text} opacity-80`}>Member ID</p>
          <p className={`font-medium ${tierColors[tier].text}`}>{memberId}</p>
        </div>
        <div>
          <p className={`text-xs ${tierColors[tier].text} opacity-80`}>Member Since</p>
          <p className={`font-medium ${tierColors[tier].text}`}>{since}</p>
        </div>
        <div>
          <p className={`text-xs ${tierColors[tier].text} opacity-80`}>Valid Until</p>
          <p className={`font-medium ${tierColors[tier].text}`}>{expiryDate}</p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <svg className="h-16 w-16 opacity-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 4L3 9.31372L10.5 13.5M20 4L14.5 21L10.5 13.5M20 4L10.5 13.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
