import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/cart" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                カート
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div>
        <h1>Home</h1>
<<<<<<< HEAD
        <p>こんにちは！</p>
=======
        <p>Welcome to the POS app home page!</p>
>>>>>>> 8a443ede1307b57c86b31cab95ec2d39c58f0271
      </div>
    </div>
  );
}
