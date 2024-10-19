"use client";

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
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import Link from "next/link";

interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function Home() {
  const [productCode, setProductCode] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    // クライアントサイドのみで処理を行う
    setProductName("おーいお茶");
    setProductPrice("150");
  }, []);

  // const handleReadProduct = async (): Promise<void> => {
  //   // ここで商品コードをバックエンドに送信し、商品情報を取得する処理を実装します
  //   // 仮の実装として、ハードコードした商品情報を返します
  //   setProductName("おーいお茶");
  //   setProductPrice("150");
  // };

  const handleAddProduct = (): void => {
    if (productName && productPrice) {
      const newItem: PurchaseItem = {
        name: productName,
        quantity: 1,
        price: parseInt(productPrice),
        total: parseInt(productPrice),
      };
      setPurchaseList([...purchaseList, newItem]);
      setProductCode("");
      setProductName("");
      setProductPrice("");
    }
  };

  const handlePurchase = async (): Promise<void> => {
    // ここで購入処理をバックエンドに送信する処理を実装します
    // 仮の実装として、合計金額を計算してアラートで表示します
    const total = purchaseList.reduce((sum, item) => sum + item.total, 0);
    alert(`合計金額: ${total}円`);
    setPurchaseList([]);
  };

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
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">POSアプリ</h1>
        <div className="mb-4">
          <Input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="商品コード"
            className="mb-2"
          />
          <Button onClick={() => setProductName("おーいお茶")}>読み込み</Button>
        </div>
        <div className="mb-4">
          <Input
            type="text"
            value={productName}
            readOnly
            placeholder="商品名"
            className="mb-2"
          />
          <Input
            type="text"
            value={productPrice}
            readOnly
            placeholder="単価"
            className="mb-2"
          />
          <Button onClick={handleAddProduct}>追加</Button>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">購入リスト</h2>
          <ul>
            {purchaseList.map((item, index) => (
              <li key={index}>
                {item.name} x{item.quantity} {item.price}円 {item.total}円
              </li>
            ))}
          </ul>
        </div>
        <Button
          className={buttonVariants({ variant: "outline" })}
          onClick={handlePurchase}
        >
          購入
        </Button>
      </main>
    </div>
  );
}
