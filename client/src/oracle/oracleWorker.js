import { useState, useEffect } from "react";
import { ethers } from "ethers";
import MyContract from "./contracts/Oracle.json";

function oracleWorker() {
  const [response, setResponse] = useState("");

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const oracleJson = require('./contracts/Oracle.json'); // si usas require()
    const oracleContract = new ethers.Contract(oracleJson.networks[80001].address, oracleJson.abi, signer);


    const interval = setInterval(() => {
        oracleContract.myMethod()
        .then((res) => {
          setResponse(res);
        })
        .catch((err) => {
          console.error(err);
        });
    }, 259200000); // 259200000ms = 3 días

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>API Response: {response}</p>
    </div>
  );
}
