import React, { useEffect, useState} from 'react'
import {Button, Card, PageHeader, notification} from "antd";
import {SendOutlined, DollarCircleOutlined, CrownOutlined,HeartOutlined, StarFilled ,CrownFilled, FrownOutlined, ThunderboltFilled , BugOutlined ,GroupOutlined } from "@ant-design/icons";
import ModalTransferNFT from "../components/ModalTransferNFT";
import ModalSale from "../components/ModalSale";
import ModalAuction from "../components/ModalAuction";
import {default as PublicKey, transactions, utils} from "near-api-js"
import { functionCall, createTransaction } from "near-api-js/lib/transaction";
import ModalMintNFT from "../components/ModelMintNFT";
import {login, parseTokenAmount} from "../utils";
import BN from "bn.js";
import {baseDecode} from "borsh";
import getConfig from '../config'
import { Carousel , Space,Radio, Row, Input,Col } from 'antd';
import { Link } from 'react-router-dom'
import '../global.css'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')
const { Meta } = Card;

function Mint() {
   const stars = [[<StarFilled style={{color:"#ff9e0d"}}/>,<StarFilled />,<StarFilled />,<StarFilled />,<StarFilled />]
    ,[<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled />,<StarFilled />,<StarFilled />]
   ,[<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled />,<StarFilled />]
   ,[<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled />]
   ,[<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>,<StarFilled  style={{color:"#ff9e0d"}}/>]]
    
   const hungry = [
    [<FrownOutlined style={{color:"rgb(225 14 149)"}}/>, <FrownOutlined style={{color:"rgb(229 162 205)"}} />,<FrownOutlined style={{color:"rgb(229 162 205)"}} />,<FrownOutlined style={{color:"rgb(229 162 205)"}} />],
    [<FrownOutlined style={{color:"rgb(225 14 149)"}}/>, <FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(229 162 205)"}} />,<FrownOutlined style={{color:"rgb(229 162 205)"}} />],
    [<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(229 162 205)"}} />],
    [<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,<FrownOutlined style={{color:"rgb(225 14 149)"}}/>,],
    ];
   
   const [nfts, setNFTs] = useState([]);
    const [male, setMale] = useState();
    const [female, setFeMale] = useState();
    const [transferVisible, setTransferVisible] = useState(false);
    const [saleVisible, setSaleVisible] = useState(false);
    const [auctionVisible, setAuctionVisible] = useState(false);
    const [mintVisible, setMintVisible] = useState(false);
    const [matingVisible, setMatingtVisible] = useState(false);
    const [currentToken, setCurrentToken] = useState(null);

    const [element, setElement] = useState(0)

    useEffect(async () => {
        if (window.accountId) {
            let data  = await window.contractNFT.nft_tokens_for_owner({"account_id": window.accountId, "from_index": "0", "limit": 100});
            console.log("Data: ", data);
            setNFTs(data);
        }
    }, []);

    function handleTransferToken(token) {
        setCurrentToken(token);

        setTransferVisible(true);
    }

    function  getGas(gas) {
        return gas ? new BN(gas) : new BN('100000000000000');
    }
    function getAmount(amount) {
        return amount ? new BN(utils.format.parseNearAmount(amount)) : new BN('0');
    }

    function handleSaleToken(token) {
        setCurrentToken(token);

        setSaleVisible(true);
    }

    function handleAuctionToken(token) {
        setCurrentToken(token);

        setAuctionVisible(true);
    }

    async function submitTransfer(accountId, tokenId) {
        try {
            if (accountId && currentToken.token_id) {
                await window.contractNFT.nft_transfer(
                    {
                        receiver_id: accountId,
                        token_id: currentToken.token_id,
                        approval_id: 0,
                        memo: "Transfer to " + accountId
                    },
                    30000000000000,
                    1
                );
                setTransferVisible(false);
            }
        } catch (e) {
            console.log("Transfer error: ", e);
            setTransferVisible(false);
        } finally {
            setTransferVisible(false);
        }
    }

    async function createTransactionA({
        receiverId,
        actions,
        nonceOffset = 1,
    }) {
        const localKey = await this.connection.signer.getPublicKey(
            this.accountId,
            this.connection.networkId
        );
        let accessKey = await this.accessKeyForTransaction(
            receiverId,
            actions,
            localKey
        );
        if (!accessKey) {
            throw new Error(
                `Cannot find matching key for transaction sent to ${receiverId}`
            );
        }

        const block = await this.connection.provider.block({ finality: 'final' });
        const blockHash = baseDecode(block.header.hash);

        const publicKey = PublicKey.from(accessKey.public_key);
        const nonce = accessKey.access_key.nonce + nonceOffset;

        return createTransaction(
            this.accountId,
            publicKey,
            receiverId,
            nonce,
            actions,
            blockHash
        );
    }

    async function executeMultiTransactions(transactions, callbackUrl) {
        const nearTransactions = await Promise.all(
            transactions.map((t, i) => {
                return createTransactionA({
                    receiverId: t.receiverId,
                    nonceOffset: i + 1,
                    actions: t.functionCalls.map((fc) =>
                        functionCall(
                            fc.methodName,
                            fc.args,
                            getGas(fc.gas),
                            getAmount(fc.amount)
                        )
                    ),
                });
            })
        );

        return window.walletConnection.requestSignTransactions(nearTransactions);
    }

    async function submitOnAuction(token, startPrice, startTime, endTime) {
        try {
            if (startPrice && currentToken.token_id) {

                let auction_conditions = token === "NEAR" ? 
                        {
                            is_native: true,
                            contract_id: "near",
                            decimals: "24",
                            start_price: utils.format.parseNearAmount(startPrice.toString()),
                            start_time: startTime.toString(),
                            end_time: endTime.toString(),
                        } : {
                            is_native: false,
                            contract_id: window.contractFT.contractId,
                            decimals: "18",
                            amount: parseTokenAmount(price, 18).toLocaleString('fullwide', {useGrouping:false})
                        };

                // Check storage balance
                let storageAccount = await window.contractMarket.storage_balance_of({
                    account_id: window.accountId
                });

                // Submit auction
                if (storageAccount > 0) {
                    console.log("Data: ", storageAccount, utils.format.parseNearAmount("0.1"), nearConfig.marketContractName);
                    await window.contractNFT.nft_auction_approve({
                        token_id: currentToken.token_id,
                        account_id: nearConfig.marketContractName,
                        msg: JSON.stringify({auction_conditions})
                    },
                    30000000000000, utils.format.parseNearAmount("0.01"));
                    setAuctionVisible(false);
                } else {
                    notification["warning"]({
                        message: 'Không đủ Storage Balance',
                        description:
                          'Storage Balance của bạn không đủ để đăng bán NFT mới. Vui lòng nạp thêm tại đây!',
                      });
                }
            }

        } catch (e) {
            console.log("Transfer error: ", e);
            setTransferVisible(false);
        } finally {
            setTransferVisible(false);
        }
    }

    async function submitOnSale (token, price) {
        try {
            if (price && currentToken.token_id) {

                let sale_conditions = token === "NEAR" ? 
                        {
                            is_native: true,
                            contract_id: "near",
                            decimals: "24",
                            amount: utils.format.parseNearAmount(price.toString())
                        } : {
                            is_native: false,
                            contract_id: window.contractFT.contractId,
                            decimals: "18",
                            amount: parseTokenAmount(price, 18).toLocaleString('fullwide', {useGrouping:false})
                        };

                // Check storage balance
                let storageAccount = await window.contractMarket.storage_balance_of({
                    account_id: window.accountId
                });

                // Submit sale
                if (storageAccount > 0) {
                    console.log("Data: ", storageAccount, utils.format.parseNearAmount("0.1"), nearConfig.marketContractName);
                    await window.contractNFT.nft_approve({
                        token_id: currentToken.token_id,
                        account_id: nearConfig.marketContractName,
                        msg: JSON.stringify({sale_conditions})
                    },
                    30000000000000, utils.format.parseNearAmount("0.01"));
                    setSaleVisible(false);
                } else {
                    notification["warning"]({
                        message: 'Không đủ Storage Balance',
                        description:
                          'Storage Balance của bạn không đủ để đăng bán NFT mới. Vui lòng nạp thêm tại đây!',
                      });
                }
            }

        } catch (e) {
            console.log("Transfer error: ", e);
            setTransferVisible(false);
        } finally {
            setTransferVisible(false);
        }
    }

    async function submitOnMint() {
        // call NFT contract mint_token
        try {
            await window.contractNFT.nft_mint({
                //token_id: data.tokenId,
                element: element,
                receiver_id: window.accountId,
                // metadata: {
                //     title: data.tokenTitle,
                //     description: data.description,
                //     media: data.media
                // }
            }, 30000000000000, utils.format.parseNearAmount("0.01"))
        } catch (e) {
            console.log("Error: ", e);
        }
    }

    function handleClickMint() {
        if (window.walletConnection.isSignedIn()) {
            //setMintVisible(true);
            submitOnMint()
        } else {
            login();
        }
    }

    function handleClickMating() {
        if (window.walletConnection.isSignedIn()) {
            setMatingtVisible(true);
        } else {
            login();
        }
    }
    function onCheckMale(e) {
        console.log('radio checked', e.target.value);
        setMale(e.target.value)
    };
    function onCheckFemale(e) {
        console.log('radio checked', e.target.value);
        setFeMale(e.target.value)
    };

    async function matingDragon(token_id_ma, token_id_fe) {
        
        try {
            if (token_id_ma && token_id_fe) {
                await window.contractNFT.mating_dragon(
                    {
                        token_id_ma: token_id_ma,
                        token_id_fe: token_id_fe,
                    },
                    30000000000000,
                    utils.format.parseNearAmount("0.006")
                );
                
            }
        } catch (e) {
            console.log("Mating error: ", e);
        }
    
    }

    function handleClickMint() {
        if (window.walletConnection.isSignedIn()) {
            //setMintVisible(true);
            submitOnMint()
        } else {
            login();
        }
    }

    async function submitOnMint() {
        // call NFT contract mint_token
        try {
            await window.contractNFT.nft_mint({
                //token_id: data.tokenId,
                element: element,
                receiver_id: window.accountId,
                // metadata: {
                //     title: data.tokenTitle,
                //     description: data.description,
                //     media: data.media
                // }
            }, 30000000000000, utils.format.parseNearAmount("0.01"))
        } catch (e) {
            console.log("Error: ", e);
        }
    }

    function onChange(a) {
        setElement(a)
      }
      
    const contentStyle = {
        height: '100%',
        padding: '0% 25% 5%'
    };

    return (
        <div className='mint'>
            {console.log(element)}
            <Carousel afterChange={onChange}>
                <div>
                    <img style={contentStyle} src={require('../assets/dragon1.gif')}/>
                </div>
                <div>
                    <img style={contentStyle} src={require('../assets/dragon2.gif')}/>
                </div>
                <div>
                    <img style={contentStyle} src={require('../assets/dragon3.gif')}/>
                </div>
                <div>
                    <img style={contentStyle} src={require('../assets/dragon4.gif')}/>
                </div>
            </Carousel>
            <Button onClick={handleClickMint} className="click-mint">Mint DRAGON NOW!</Button>
        </div>
    )
}

export default Mint;