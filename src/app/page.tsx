"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";

interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ItemResponse {
  id?: number;
  name?: string;
  price?: number;
  message?: string;
}

interface OrderResponse {
  message?: string;
  order_id?: number;
}

export default function Home() {
  const [productCode, setProductCode] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);

  // useEffect(() => {
  //   // クライアントサイドのみで処理を行う
  //   setProductName("おーいお茶");
  //   setProductPrice("150");
  // }, []);

  // const handleReadProduct = async (): Promise<void> => {
  //   // ここで商品コードをバックエンドに送信し、商品情報を取得する処理を実装します
  //   // 仮の実装として、ハードコードした商品情報を返します
  //   setProductName("おーいお茶");
  //   setProductPrice("150");
  // };

  const handleReadProduct = async (): Promise<void> => {
    try {
      const response = await axios.get<ItemResponse>(
        `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net/items?code=${productCode}`
      );
      if (response.data && response.data.name) {
        setProductName(response.data.name);
        setProductPrice(response.data.price?.toString() || "");
      } else {
        alert("商品がマスタ未登録です");
        setProductName("");
        setProductPrice("");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`商品情報の取得に失敗しました: ${error.message}`);
      } else {
        alert("商品情報の取得に失敗しました: 不明なエラーが発生しました");
      }
    }
  };

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
    try {
      const total = purchaseList.reduce((sum, item) => sum + item.total, 0);
      const purchaseData = {
        items: purchaseList,
        total,
      };
      const response = await axios.post<OrderResponse>(
        `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net/orders`,
        purchaseData
      );
      if (response.data && response.data.message) {
        alert(`合計金額: ${total}円`);
        setPurchaseList([]);
      } else {
        alert("購入処理に失敗しました");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`購入処理に失敗しました: ${error.message}`);
      } else {
        alert("購入処理に失敗しました: 不明なエラーが発生しました");
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
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
        <h1 className="text-2xl font-bold mb-4 text-center">POSアプリ</h1>
        <div className="mb-4 flex flex-col items-center">
          <Input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="商品コード"
            className="mb-2 w-full sm:w-1/2"
          />
          <Button className="w-full sm:w-1/2" onClick={handleReadProduct}>
            読み込み
          </Button>
        </div>
        <div className="mb-4 flex flex-col items-center">
          <Input
            type="text"
            value={productName}
            readOnly
            placeholder="商品名"
            className="mb-2 w-full sm:w-1/2"
          />
          <Input
            type="text"
            value={productPrice}
            readOnly
            placeholder="単価"
            className="mb-2 w-full sm:w-1/2"
          />
          <Button className="w-full sm:w-1/2" onClick={handleAddProduct}>
            追加
          </Button>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2 text-center">購入リスト</h2>
          <ul className="list-disc list-inside">
            {purchaseList.map((item, index) => (
              <li key={index} className="text-center">
                {item.name} x{item.quantity} {item.price}円 {item.total}円
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })}`}
            onClick={handlePurchase}
          >
            購入
          </Button>
        </div>
      </main>
    </div>
  );
}
