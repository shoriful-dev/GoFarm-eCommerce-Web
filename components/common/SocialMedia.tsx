"use client";

import { FaYoutube, FaFacebook, FaGithub, FaLinkedin, FaSlack } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
}

const socialLink = [
  {
    title: "Youtube",
    href: "https://www.youtube.com/@reactjsBD",
    icon: <FaYoutube className="w-5 h-5" />,
  },
  {
    title: "Github",
    href: "https://www.youtube.com/@reactjsBD",
    icon: <FaGithub className="w-5 h-5" />,
  },
  {
    title: "Linkedin",
    href: "https://www.youtube.com/@reactjsBD",
    icon: <FaLinkedin className="w-5 h-5" />,
  },
  {
    title: "Facebook",
    href: "https://www.youtube.com/@reactjsBD",
    icon: <FaFacebook className="w-5 h-5" />,
  },
  {
    title: "Slack",
    href: "https://www.youtube.com/@reactjsBD",
    icon: <FaSlack className="w-5 h-5" />,
  },
];

const SocialMedia = ({ className, iconClassName, tooltipClassName }: Props) => {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-3.5 text-zinc-400", className)}>
        {socialLink.map((item) => (
          <Tooltip key={item.title}>
            <TooltipTrigger asChild>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-2 border rounded-full hover:text-white hover:border-gofarm-green hoverEffect",
                  iconClassName
                )}
              >
                {item.icon}
              </a>
            </TooltipTrigger>
            <TooltipContent
              className={cn(
                "bg-white text-gofarm-black font-semibold",
                tooltipClassName
              )}
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default SocialMedia;
