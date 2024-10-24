"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Quagga from "@ericblade/quagga2";

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}
interface PurchaseItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number; // Added for display purposes
}

interface Order {
  emp_cd: string;
  items: OrderItem[];
}

interface OrderItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface OrderResponse {
  message: string;
  order_id: number;
  total_amount: number;
  total_amount_ex_tax: number;
}

const API_BASE_URL =
  "https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net";

export default function Home() {
  const [productCode, setProductCode] = useState<string>("");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
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
    try {
      const response = await axios.get(
        `${API_BASE_URL}/product?code=${productCode}`
      );
      const data = response.data;
      if (data) {
        setCurrentProduct({
          id: data.id,
          code: productCode,
          name: data.name,
          price: data.price,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        handleAlert("商品がマスタ未登録です");
      } else {
        handleApiError(error);
      }
      setCurrentProduct(null);
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
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#scanner-container") || undefined,
          constraints: {
            facingMode: "environment",
            width: 480,
            height: 320,
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
    if (currentProduct) {
      const existingItemIndex = purchaseList.findIndex(
        (item) => item.product_code === currentProduct.code
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const updatedList = [...purchaseList];
        updatedList[existingItemIndex].quantity += 1;
        updatedList[existingItemIndex].total =
          updatedList[existingItemIndex].quantity *
          updatedList[existingItemIndex].product_price;
        setPurchaseList(updatedList);
      } else {
        // Add new item
        const newItem: PurchaseItem = {
          product_id: currentProduct.id,
          product_code: currentProduct.code,
          product_name: currentProduct.name,
          product_price: currentProduct.price,
          quantity: 1,
          total: currentProduct.price,
        };
        setPurchaseList([...purchaseList, newItem]);
      }
      handleAlert(
        `商品「${currentProduct.name}」が購入リストに追加されました。`
      );
      resetFields();
    }
  };

  const handlePurchase = async () => {
    if (purchaseList.length === 0) {
      handleAlert("購入リストが空です。");
      return;
    }

    const order: Order = {
      emp_cd: "9999999999", // デフォルト値
      items: purchaseList.map(
        ({
          product_id,
          product_code,
          product_name,
          product_price,
          quantity,
        }) => ({
          product_id,
          product_code,
          product_name,
          product_price,
          quantity,
        })
      ),
    };

    try {
      const response = await axios.post<OrderResponse>(
        `${API_BASE_URL}/orders`,
        order
      );
      const { total_amount, total_amount_ex_tax } = response.data;
      handleAlert(
        `購入が完了しました。\n` +
          `合計金額（税込）: ${total_amount}円\n` +
          `合計金額（税抜）: ${total_amount_ex_tax}円`
      );
      setPurchaseList([]);
    } catch (error) {
      handleApiError(error);
    }
  };

  const resetFields = () => {
    setProductCode("");
    setCurrentProduct(null);
  };

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
            style={{
              width: "280px",
              height: "180px",
              marginBottom: "1rem",
            }}
          >
            {!isScanning && (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <p className="text-brown-700 text-center">カメラ停止中...</p>
              </div>
            )}
          </div>
          <Input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            onBlur={handleProductFetch}
            placeholder="商品コードを入力"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
        </div>
        <div className="mb-6 flex flex-col items-center">
          <Input
            type="text"
            value={currentProduct?.name || ""}
            readOnly
            placeholder="商品名"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
          <Input
            type="text"
            value={currentProduct?.price ? `${currentProduct.price}円` : ""}
            readOnly
            placeholder="単価"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })} px-6 py-3 text-lg rounded-lg bg-orange-900 text-white shadow-md hover:bg-orange-400`}
            onClick={handleAddToCart}
            disabled={!currentProduct}
          >
            追加
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center text-orange-800 font-retro">
            購入リスト
          </h2>
          <ul className="list-none mb-4">
            {purchaseList.map((item, index) => (
              <li
                key={index}
                className="flex justify-between bg-brown-200 p-4 mb-2 rounded-lg shadow-sm hover:bg-brown-300 text-center font-retro text-white"
              >
                <span>
                  {item.product_name} x{item.quantity}
                </span>
                <span>{item.product_price}円</span>
                <span>{item.total}円</span>
              </li>
            ))}
          </ul>
          {purchaseList.length > 0 && (
            <Button
              className={`w-full ${buttonVariants({
                variant: "outline",
              })} px-6 py-3 text-lg rounded-lg bg-green-600 text-white shadow-md hover:bg-green-500`}
              onClick={handlePurchase}
            >
              購入
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
