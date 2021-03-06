import React, { useEffect, useState } from 'react'
import {Button, Card, PageHeader, notification, Input} from "antd";
import {ShoppingCartOutlined, ArrowDownOutlined} from "@ant-design/icons";
import { utils, transactions } from "near-api-js";
import {login, parseTokenWithDecimals} from "../utils";
import { functionCall } from 'near-api-js/lib/transaction';
import {SendOutlined, DollarCircleOutlined, CrownOutlined, EllipsisOutlined,StarFilled ,CrownFilled, FrownOutlined, ThunderboltFilled , BugOutlined ,GroupOutlined} from "@ant-design/icons";
import { Progress,Row, Col } from 'antd';
import getConfig from '../config'
const nearConfig = getConfig(process.env.NODE_ENV || 'development')

const { Meta } = Card;

function MarketPlace() {
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
    const [lvl, setLvl] = useState(null);
    const [data, setData] = useState([]);
    const [tokenList, setTokenList] = useState([]);
    const [price, setPrice] = useState(0);
    
    async function handleBuy(item) {
        console.log(item);
        console.log(price);
        let auctionContractAndTokenId = await window.contractMarket.get_auction_contract_and_token_id({
            nft_contract_id:  item.nft_contract_id,
            token_id:item.token_id
         });

         if (window.accountId == auctionContractAndTokenId.owner_id) {
        notification["warning"]({
            message: 'Kh??ng Th??? ?????u Gi??',
            description:
                'B???n Kh??ng Th??? T??? ?????u Gi?? Auction C???a M??nh!',
            });

            return;
        };

        if (parseInt(new Date().getTime()) < parseInt(auctionContractAndTokenId.auction_conditions.start_time)) {
        notification["warning"]({
            message: 'Phi??n ?????u Gi?? Ch??a B???t ?????u',
            description:
                'Ch??a ?????n th???i gian ?????u gi??!',
            });

            return;
        };

        if (parseInt(new Date().getTime()) > parseInt(auctionContractAndTokenId.auction_conditions.end_time)) {
        notification["warning"]({
            message: 'Phi??n ?????u Gi?? ???? K???t Th??c',
            description:
                '???? qua th???i gian ?????u gi??!',
            });

            return;
        };

        if (price*1000000000000000000000000 <= auctionContractAndTokenId.current_price) {
        notification["warning"]({
            message: 'Gi?? qu?? th???p',
            description:
                'Gi?? b???n ????a gia ph???i l???n h??n! ' + auctionContractAndTokenId.current_price/1000000000000000000000000 + " Near",
            });

            return;
        };

        try {
           if ( !window.walletConnection.isSignedIn() ) return login();

           if (item.auction_conditions.is_native) {
            let nearBalance = await window.account.getAccountBalance();
            if (nearBalance.available < parseInt(item.current_price)) {
                notification["warning"]({
                    message: 'S??? d?? NEAR kh??ng ?????',
                    description:
                      'T??i kho???n c???a b???n kh??ng ????? s??? d?? ????? ?????u gi?? NFT!',
                  });

                  return;
            }

            await window.contractMarket.offer_auction(
                {
                    nft_contract_id: item.nft_contract_id,
                    token_id: item.token_id
                },
                300000000000000,
                utils.format.parseNearAmount(price.toString())
            )
           } else {
               // Check balance
                let UPDRABalance = await window.contractFT.ft_balance_of({account_id: window.accountId})
                if (UPDRABalance < parseInt(item.auction_conditions.amount)) {
                    notification["warning"]({
                        message: 'S??? d?? UPDRA kh??ng ?????',
                        description:
                        'T??i kho???n c???a b???n kh??ng ????? s??? d?? ????? mua NFT!',
                    });

                    return;
                }

               // Handle storage deposit
               let message = {
                   nft_contract_id: window.contractNFT.contractId,
                   token_id: item.token_id
               }
               const result = await window.account.signAndSendTransaction({
                   receiverId: window.contractFT.contractId,
                   actions: [
                       transactions.functionCall(
                           'storage_deposit', 
                           {account_id: item.owner_id},
                           10000000000000, 
                           utils.format.parseNearAmount("0.01")
                        ),
                       transactions.functionCall(
                           'ft_transfer_call', 
                           { receiver_id: window.contractMarket.contractId, amount: item.auction_conditions.amount, msg: JSON.stringify(message) },
                           250000000000000,
                           "1"
                        )
                   ]
               });

               console.log("Result: ", result);
           }

        } catch (e) {
            console.log("Error: ", e);
        }
    }


    async function handleClaim(item) {
        //console.log(item);
        //console.log("id: ", window.accountId);
        
        try {
           if ( !window.walletConnection.isSignedIn() ) return login();

           let auctionContractAndTokenId = await window.contractMarket.get_auction_contract_and_token_id({
               nft_contract_id:  item.nft_contract_id,
               token_id:item.token_id
            });
           console.log(auctionContractAndTokenId);
           if (window.accountId != auctionContractAndTokenId.winner) {
            notification["warning"]({
                message: 'Kh??ng Ph???i Winner',
                description:
                  'B???n Kh??ng ph???i Winner kh??ng th???  claim NFT!',
              });

                return;
            };

            if (parseInt(new Date().getTime()) < parseInt(auctionContractAndTokenId.auction_conditions.end_time)) {
            notification["warning"]({
                message: '?????u gi?? ch??a k???t th??c',
                description:
                    'Ch??a k???t th??c ?????u gi?? kh??ng th??? claim NFT!',
                });

                return;
            };
            

           if (item.auction_conditions.is_native) {
            let nearBalance = await window.account.getAccountBalance();
            if (nearBalance.available < parseInt(item.current_price)) {
                notification["warning"]({
                    message: 'S??? d?? NEAR kh??ng ?????',
                    description:
                      'T??i kho???n c???a b???n kh??ng ????? s??? d?? ????? ?????u gi?? NFT!',
                  });

                  return;
            }

            await window.contractMarket.claim_nft(
                {
                    nft_contract_id: item.nft_contract_id,
                    token_id: item.token_id
                },
                300000000000000,
                utils.format.parseNearAmount("0")
            )
           } else {
               // Check balance
                let UPDRABalance = await window.contractFT.ft_balance_of({account_id: window.accountId})
                if (UPDRABalance < parseInt(item.auction_conditions.amount)) {
                    notification["warning"]({
                        message: 'S??? d?? UPDRA kh??ng ?????',
                        description:
                        'T??i kho???n c???a b???n kh??ng ????? s??? d?? ????? ?????u gi?? NFT!',
                    });

                    return;
                }

               // Handle storage deposit
               let message = {
                   nft_contract_id: window.contractNFT.contractId,
                   token_id: item.token_id
               }
               const result = await window.account.signAndSendTransaction({
                   receiverId: window.contractFT.contractId,
                   actions: [
                       transactions.functionCall(
                           'storage_deposit', 
                           {account_id: item.owner_id},
                           10000000000000, 
                           utils.format.parseNearAmount("0.01")
                        ),
                       transactions.functionCall(
                           'ft_transfer_call', 
                           { receiver_id: window.contractMarket.contractId, amount: item.auction_conditions.amount, msg: JSON.stringify(message) },
                           250000000000000,
                           "1"
                        )
                   ]
               });

               console.log("Result: ", result);
           }

        } catch (e) {
            console.log("Error: ", e);
        }
    }

    useEffect(async () => {
        try {
            let data  = await window.contractMarket.get_auctions(
                {
                    from_index: "0",
                    limit: 20
                }
            );

            let mapItemData = data.map(async item => {
                let itemData =  await window.contractNFT.nft_token({token_id: item.token_id.toString()});
                
                return {
                    ...item,
                    itemData
                }
            });
        
            let dataNew = await Promise.all(mapItemData);
            console.log("Data market: ", dataNew);
            setData(dataNew);
        } catch (e) {
            console.log(e);
        }
    }, []);

    useEffect(async () => {
        if (window.accountId) {
            // Get token list
            let tokenList = [];
            let nearBalance = await window.account.getAccountBalance();
            let UPDRABalance = await window.contractFT.ft_balance_of({account_id: window.accountId})

            tokenList.push({
                isNative: true,
                symbol: "NEAR",
                balance: nearBalance.available,
                decimals: 24,
                contractId: "near"
            });

            tokenList.push({
                isNative: false,
                symbol: "UPDRA",
                balance: UPDRABalance,
                decimals: 18,
                contractId: window.contractFT.contractId
            });

            setTokenList(tokenList);
        }
    }, []);

    return (
        <div>
            <PageHeader
                className="site-page-header"
                title="Auctions"
            />
            <div style={{ padding: 30, display: "flex" }}>
                {
                    data.map( nft => {
                        return (
                            <Card
                                key={nft.token_id}
                                hoverable
                                style={{ width: 240, marginRight: 15, marginBottom: 15 }}
                                cover={<img style={{height: 300, width: "100%", objectFit: "contain"}} alt="Media NFT" src={nearConfig.imgs[nft.itemData.metadata.quality]} />}
                                actions={[
                                    <Input type={"number"} onChange={(e) => setPrice(e.target.value)} placeholder={"ex: 1000 ..."} size="large" />,
                                    <Button onClick={() => handleBuy(nft)} icon={<ShoppingCartOutlined />}> Bid </Button>,
                                    <Button onClick={() => handleClaim(nft)} icon={<ArrowDownOutlined />}> Claim </Button>
                                ]}
                            >
                                <div style={{ fontSize: '20px' }}> <CrownFilled /> Level: {Math.floor(Math.log2(nft.itemData.metadata.exp/50)) < 0 ? 0 : Math.floor(Math.log2(nft.itemData.metadata.exp/50)) +1 } </div>
                                        
                                <Card>????? hi???m: {stars[nft.itemData.metadata.quality-1]} </Card>
                                Sinh l???c:<Progress percent={nft.itemData.metadata.blood/nft.itemData.metadata.blood*100}  strokeColor="red"/>
                                <BugOutlined /> Th??? h??? Gen th???: {nft.itemData.metadata.generation} <br/>
                                <GroupOutlined /> M?? Gen: {nft.itemData.metadata.gen} <br/>
                                <ThunderboltFilled /> S???c m???nh: {nft.itemData.metadata.power} <br/>
                                <ThunderboltFilled /> Ch?? m???ng: {nft.itemData.metadata.strike}% <br/>
                                Th??? ch???t:<Progress percent={nft.itemData.metadata.physical/nft.itemData.metadata.physical*100}  strokeColor="CornflowerBlue"/>
            
                                ????i: {Math.floor((new Date().getTime() - nft.itemData.metadata.time_born ) / 300000  - nft.itemData.metadata.feeding_times)>4 ? hungry[3]: hungry[Math.floor((new Date().getTime() - nft.itemData.metadata.time_born ) / 300000  - nft.itemData.metadata.feeding_times)]}
                                <br/> <br/>

                                Gi???ng: {nft.itemData.metadata.sex ? "?????c": "C??i"} <br/> 


                                <h1>Current Price: {nft.auction_conditions.is_native ? 
                                    utils.format.formatNearAmount(nft.current_price) + " NEAR":
                                    parseTokenWithDecimals(item.auction_conditions.current_price, nft.auction_conditions.decimals) + " UPDRA"
                                }</h1>
                                <h1>Winner: {nft.winner}</h1>
                                <p>Start Time: { new Date(parseInt(nft.auction_conditions.start_time)).toLocaleString()}</p>
                                <p>End Time: { new Date(parseInt(nft.auction_conditions.end_time)).toLocaleString()}</p>
                                <Meta title={"ID: " + nft.token_id}  description={nft.owner_id} />
                            </Card>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default MarketPlace;