"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
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

  const handleProductFetch = useCallback(async (): Promise<void> => {
    if (!productCode) {
      handleAlert("商品コードを読み取りました。");
      return;
    }
    const data = await getApiCall(
      `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net/product?code=${productCode}`
    );
    if (data && data.name) {
      setProductName(data.name);
      setProductPrice(data.price?.toString() || "");
    }
  }, [productCode]);

  const stopQuagga = useCallback(() => {
    Quagga.stop();
    Quagga.offDetected();
  }, []);

  const startQuagga = useCallback(() => {
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: document.querySelector("#scanner-container") || undefined,
          constraints: {
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["ean_reader", "code_128_reader"],
        },
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
  }, [handleProductFetch]);

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

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      handleAlert(`エラーが発生しました: ${error.message}`);
    } else if (error instanceof Error) {
      handleAlert(`エラーが発生しました: ${error.message}`);
    } else {
      handleAlert("不明なエラーが発生しました");
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

  const resetFields = () => {
    setProductCode("");
    setProductName("");
    setProductPrice("");
  };

  const [letter, setLetter] = useState<string>("");

  useEffect(() => {
    const fetchLetter = async () => {
      const res = await fetch(
        `https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net`
      );
      const data = await res.text();
      setLetter(data);
    };

    fetchLetter();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-2xl bg-yellow-100 rounded-3xl shadow-lg">
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-orange-800 font-retro">
          よみとるよん！
        </h1>
        <div className="mb-6 flex flex-col items-center">
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })} mb-4 px-6 py-3 text-lg rounded-lg shadow-md bg-orange-900 text-white hover:bg-orange-400`}
            onClick={() => setIsScanning(!isScanning)}
          >
            {isScanning ? "スキャン停止" : "スキャン（カメラ）"}
          </Button>
          <div
            id="scanner-container"
            className="w-full sm:w-1/2 h-48 mb-4 border-2 rounded-lg flex items-center justify-center bg-gray-300"
          >
            {isScanning && (
              <p className="text-brown-700 text-center">スキャン中...</p>
            )}
          </div>
          <Input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="商品コードを入力"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
        </div>
        <div className="mb-6 flex flex-col items-center">
          <Input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="商品名"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
          <Input
            type="text"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="単価"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })} px-6 py-3 text-lg rounded-lg bg-orange-900 text-white shadow-md hover:bg-orange-400`}
            onClick={handleAddToCart}
          >
            追加
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center text-orange-800 font-retro">
            購入リスト
          </h2>
          <ul className="list-none">
            {purchaseList.map((item, index) => (
              <li
                key={index}
                className="flex justify-between bg-brown-200 p-4 mb-2 rounded-lg shadow-sm hover:bg-brown-300 text-center font-retro text-white"
              >
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>{item.price}円</span>
                <span>{item.total}円</span>
              </li>
            ))}
          </ul>
          <p>{letter}</p>
        </div>
      </main>
    </div>
  );
}
