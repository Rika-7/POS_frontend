"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import axios from "axios";
import Quagga from "@ericblade/quagga2";

interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ApiResponse {
  name: string;
  price: number;
}

export default function Home() {
  const [productCode, setProductCode] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isProductNotFound, setIsProductNotFound] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (isScanning) {
      // バーコードスキャンの開始
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: document.querySelector("#scanner-container") || undefined,
            constraints: {
              facingMode: "environment", // Use the back camera
            },
          },
          decoder: {
            readers: ["ean_reader", "code_128_reader"],
          },
        },
        (err) => {
          if (err) {
            console.error("Error initializing Quagga:", err);
            return;
          }
          Quagga.start();
        }
      );

      // バーコードが検出されたときの処理
      Quagga.onDetected(async (data) => {
        if (data && data.codeResult && data.codeResult.code) {
          setProductCode(data.codeResult.code);
          setIsScanning(false);
          Quagga.stop();

          // 自動で商品情報を取得
          await handleProductFetch();
        }
      });
    } else {
      // スキャンの停止
      Quagga.stop();
    }

    return () => {
      Quagga.stop(); // 時間が経過したときにスキャナを停止
    };
  }, [isScanning]);

  const handleApiCall = async (
    url: string,
    method: "GET" | "POST",
    data?: unknown
  ): Promise<ApiResponse | null> => {
    // Correct type for returned data
    try {
      if (method === "GET") {
        const response = await axios.get(url);
        return response.data;
      } else if (method === "POST") {
        const response = await axios.post(url, data);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          alert("商品がマスタ未登録です");
          setIsProductNotFound(true);
        } else {
          alert(`エラーが発生しました: ${error.message}`);
        }
      } else if (error instanceof Error) {
        alert(`エラーが発生しました: ${error.message}`);
      } else {
        alert("不明なエラーが発生しました");
      }
    }
    return null;
  };

  const handleProductFetch = async (): Promise<void> => {
    if (!productCode) {
      alert("商品コードを入力してください。");
      return;
    }
    const data = await handleApiCall(
      `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net/product?code=${productCode}`,
      "GET"
    );
    if (data && data.name) {
      setProductName(data.name);
      setProductPrice(data.price?.toString() || "");
      setIsProductNotFound(false);
    }
  };

  const handleProductRegister = async (): Promise<void> => {
    if (!productCode || !productName || !productPrice) {
      alert("商品コード、名前、および価格を入力してください。");
      return;
    }
    const data = await handleApiCall(
      `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net/create_product/`,
      "POST",
      {
        code: productCode,
        name: productName,
        price: parseInt(productPrice),
      }
    );
    if (data && data.name) {
      alert(`商品「${data.name}」が新しく登録されました。`);
      setIsProductNotFound(false);
    }
  };

  const handleAddToCart = (): void => {
    if (productName && productPrice) {
      const newItem: PurchaseItem = {
        name: productName,
        quantity: 1,
        price: parseInt(productPrice),
        total: parseInt(productPrice),
      };
      setPurchaseList([...purchaseList, newItem]);
      alert(`商品「${productName}」が購入リストに追加されました。`);
      resetFields();
    }
  };

  const handlePurchase = async (): Promise<void> => {
    try {
      const total = purchaseList.reduce((sum, item) => sum + item.total, 0);
      const purchaseData = {
        items: purchaseList,
        total,
      };
      const data = await handleApiCall(
        `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net/orders`,
        "POST",
        purchaseData
      );
      if (data) {
        alert(`合計金額: ${total}円`);
        setPurchaseList([]);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(`購入処理に失敗しました: ${error.message}`);
      } else if (error instanceof Error) {
        alert(`購入処理に失敗しました: ${error.message}`);
      } else {
        alert("購入処理に失敗しました: 不明なエラーが発生しました");
      }
    }
  };

  const resetFields = (): void => {
    setProductCode("");
    setProductName("");
    setProductPrice("");
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">POSアプリ</h1>
        <div className="mb-4 flex flex-col items-center">
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })}`}
            onClick={() => setIsScanning(!isScanning)}
          >
            {isScanning ? "スキャン停止" : "スキャン（カメラ）"}
          </Button>
          <div
            id="scanner-container"
            className="w-full sm:w-1/2 h-36 mb-4 border-2"
          ></div>

          <Input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="商品コード"
            className="mb-2 w-full sm:w-1/2"
          />
        </div>
        <div className="mb-4 flex flex-col items-center">
          <Input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="商品名"
            className="mb-2 w-full sm:w-1/2"
            readOnly={!isProductNotFound}
          />
          <Input
            type="text"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="単価"
            className="mb-2 w-full sm:w-1/2"
            readOnly={!isProductNotFound}
          />
          {isProductNotFound && (
            <Button
              className="w-full sm:w-1/2 mb-2"
              onClick={handleProductRegister}
            >
              商品登録
            </Button>
          )}
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })}`}
            onClick={handleAddToCart}
          >
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
