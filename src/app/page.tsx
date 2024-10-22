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

export default function Home() {
  const [productCode, setProductCode] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (isScanning) {
      startQuagga();
    } else {
      stopQuagga();
    }

    return () => stopQuagga();
  }, [isScanning]);

  const handleAlert = (message: string) => {
    alert(message);
  };

  const getApiCall = async (url: string) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  const postApiCall = async (url: string, data: unknown) => {
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      handleAlert(`エラーが発生しました: ${error.message}`);
    } else if (error instanceof Error) {
      handleAlert(`エラーが発生しました: ${error.message}`);
    } else {
      handleAlert("不明なエラーが発生しました");
    }
  };

  const handleProductFetch = async (): Promise<void> => {
    if (!productCode) {
      handleAlert("商品コードを入力してください。");
      return;
    }
    const data = await getApiCall(
      `https://tech-url/product?code=${productCode}`
    );
    if (data && data.name) {
      setProductName(data.name);
      setProductPrice(data.price?.toString() || "");
    }
  };

  const handleAddToCart = () => {
    if (productName && productPrice) {
      setPurchaseList([
        ...purchaseList,
        {
          name: productName,
          quantity: 1,
          price: parseInt(productPrice),
          total: parseInt(productPrice),
        },
      ]);
      handleAlert(`商品「${productName}」が購入リストに追加されました。`);
      resetFields();
    }
  };

  const startQuagga = () => {
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: document.querySelector("#scanner-container") || undefined,
          constraints: { facingMode: "environment" },
        },
        decoder: { readers: ["ean_reader", "code_128_reader"] },
      },
      (err) => {
        if (err) return console.error("Error initializing Quagga:", err);
        Quagga.start();
      }
    );
    Quagga.onDetected(async (data) => {
      if (data?.codeResult?.code) {
        setProductCode(data.codeResult.code);
        setIsScanning(false);
        stopQuagga();
        await handleProductFetch();
      }
    });
  };

  const stopQuagga = () => {
    Quagga.stop();
  };

  const resetFields = () => {
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
          />
          <Input
            type="text"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="単価"
            className="mb-2 w-full sm:w-1/2"
          />
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
      </main>
    </div>
  );
}
