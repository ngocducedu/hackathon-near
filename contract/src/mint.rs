use std::collections::HashMap;

use near_sdk::env;

use crate::*;

#[near_bindgen]
impl Contract {
    /**
     * - Yêu cầu user nạp tiền để cover phí lưu trữ
     * - Thêm token vào token_by_id
     * - Thêm token metadata
     * - Thêm token vào ds sở hữu bởi owner
     * - Refund lại NEAR user deposit thừa
     */
    #[payable]
    pub fn nft_mint(&mut self, element: u8, receiver_id: AccountId, perpetual_royalties: Option<HashMap<AccountId, u32>>) {
        let before_storage_usage = env::storage_usage();

        let mut royalty = HashMap::new();

        // if perpetual royalties were passed into the function: 
        if let Some(perpetual_royalties) = perpetual_royalties {
            //make sure that the length of the perpetual royalties is below 7 since we won't have enough GAS to pay out that many people
            assert!(perpetual_royalties.len() < 7, "Cannot add more than 6 perpetual royalty amounts");

            //iterate through the perpetual royalties and insert the account and amount in the royalty map
            for (account, amount) in perpetual_royalties {
                royalty.insert(account, amount);
            }
        }

        let token = Token {
            owner_id: receiver_id,
            approved_account_ids: HashMap::default(),
            next_approval_id: 0,
            royalty
        };

        let token_id = u128::from(self.nft_total_supply()) + 1;
         
        assert!(
            self.tokens_by_id.insert(&U128(token_id), &token).is_none(),
            "Token already exsits"
        );

        let rdnum = env::block_timestamp() % 100;
        let gen = env::block_timestamp() % 100000; 
        let quality = match rdnum {
            10 => Some(5),
            11..=17 => Some(4),
            18..=30 => Some(3),
            31..=50 => Some(2),
            _ => Some(1)
        };
        let sex = match rdnum {
            10..=15 => Some(0),
            94..=99 => Some(0),
            33..=38 => Some(0),
            45..=49 => Some(0),
            70..=75 => Some(0),
            _ => Some(1)
        };

        let media: Option<String> = match element {
            0 => Some("https://bafkreielrgolsam5c2mstan3xcs3hnmsfsl7umxd5iiiejh4bsoirsnyhe.ipfs.nftstorage.link/".to_owned()),
            1 => Some("https://bafybeidmpa7htnijbzcmgcbs3feay42j7wpp33hb3ebtz6vl3t4kxawlpm.ipfs.nftstorage.link/".to_owned()),
            2 => Some("https://bafybeievz56c3ngtxzm7qqf2izyu77szsr2ynfqyq5535sylqosgjgsr3a.ipfs.nftstorage.link/".to_owned()),
            _ => Some("https://bafybeie2owiv5nvzs42ptcoanq55icytyol6nqezmi6bqxnocbnpffyjxi.ipfs.nftstorage.link/".to_owned())
        };

        let metadata = TokenMetadata {
            title: None, 
            description: None, 
            media: media, 
            media_hash: None, 
            copies: None, 
            issued_at: None, 
            expires_at: None, 
            starts_at: None, 
            updated_at: None, 
            extra: None, 
            reference: None, 
            reference_hash: None,
            element: Some(element),
            gen: Some(gen),
            generation: Some(1),
            quality,
            exp: Some(0),
            power: Some(1),
            strike: quality,
            blood: Some(1),
            physical: Some(100),
            hunting: quality,
            sex,
            time_born: Some(U64(env::block_timestamp() / 1_000_000)),
            live: Some(true),
            feeding_times: Some(0),
            fighting_times: Some(0),
            fighting_times_onday: Some(0),
            last_time_fight: Some(U64(env::block_timestamp() / 1_000_000)),
            result_last_fight: Some(0)
        };

        self.token_metadata_by_id.insert(&U128(token_id), &metadata);

        // set token per owner
        self.internal_add_token_to_owner(&U128(token_id), &token.owner_id);

        // NFT MINT LOG
        let nft_mint_log: EventLog = EventLog {
            standard: "nep171".to_string(),
            version: "1.0.0".to_string(),
            event: EventLogVariant::NftMint(vec![ NftMintLog {
                owner_id: token.owner_id.to_string(),
                token_ids: vec![token_id.to_string()],
                memo: None
            } ])
        };
        env::log(&nft_mint_log.to_string().as_bytes());

        let after_storage_usage = env::storage_usage();
        // Refund near
        refund_deposit(after_storage_usage - before_storage_usage);
    }

    pub fn nft_token(&self, token_id: U128) -> Option<JsonToken> {
        let token = self.tokens_by_id.get(&token_id);

        if let Some(token) = token {
            let metadata = self.token_metadata_by_id.get(&token_id).unwrap();

            Some(JsonToken {
                owner_id: token.owner_id,
                token_id,
                metadata,
                approved_account_ids: token.approved_account_ids,
                royalty: token.royalty
            })
        } else {
            None
        }
    }
}