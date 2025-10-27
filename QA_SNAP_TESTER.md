# QA Test Guide: Snap-Tester Smoke Tests

## Prerequisites

- [ ] MetaMask Flask installed (not regular MetaMask)
- [ ] Hathor Snap installed and connected
- [ ] Access to snap-tester page
- [ ] Network set to **Testnet**
- [ ] Second wallet available to send 0.10 HTR (for Phase 2)

---

## Notes on card organization
The first section of the screen allows visualization of the wallet state and have some helper buttons to speed up testing. However, to actually validate each snap functionality it's better to use the individual cards, as they also display the results and errors in a clearer way.

The last section of the screen contains the Request History, which logs all requests made to the snap. This is useful to verify that requests were sent and to reproduce any desired behavior from the test session.

## Phase 1: Empty Wallet Tests

Run these tests first with a fresh wallet that has no balance.

### 1.1 Get Address
1. Leave address index at default (1)
2. Click action button
- ✅ Address is displayed on MetaMask pop-up (starts with `W`)
- Copy this value to clipboard
- ✅ No errors shown
- Check that the copied address matches the one shown in the result area

1. Click action button again with same index
2. Reject on MetaMask
3. See the error received is correctly shown

---

### 1.2 Get xPub
1. Click action button
- ✅ Extended public key displayed on MetaMask pop-up (long string starting with `xpub`)
- Copy this value to clipboard
- Paste in a text editor to verify full string is copied
- ✅ No errors shown
- Check that the copied xPub matches the one shown in the result area

---

### 1.3 Get Network
1. Click action button
- ✅ Returns `testnet`
- ✅ No confirmation dialog (instant result)
- ✅ No errors shown

---

### 1.4 Get Wallet Information
1. Click action button
- ✅ Returns both network (`testnet`) and address 0
- ✅ No confirmation dialog
- ✅ No errors shown

---

### 1.5 Get Balance (Empty)
1. Default token ID should be `00` (HTR)
2. Click action button
- ✅ Balance shows `0` or empty for HTR token
- ✅ No errors shown

---

### 1.6 Sign With Address
1. Use default message "Hello, Hathor!"
2. Select address index 0
3. Click action button
4. Approve in MetaMask dialog
- ✅ Signature returned (hex string)
- ✅ Message confirmation in result
- ✅ No errors shown

---

### 1.7 Get UTXOs (Empty)
1. Use default token ID `00`
2. Click action button
- ✅ Returns empty array `[]` or message indicating no UTXOs
- ✅ No errors shown

---

## Phase 2: Funded Wallet Tests

**⚠️ Before proceeding:** Send **0.10 HTR** from another wallet to the test wallet's address 0.

Wait for the transaction to confirm on the network (check Hathor Explorer).

---

### 2.1 Get Balance (Funded)
1. Token ID should still be `00`
2. Click action button
- ✅ Balance shows `0.10 HTR`
- ✅ No errors shown

---

### 2.2 Get UTXOs (Funded)
1. Use the default Token ID `00`
2. Click action button
- ✅ The MetaMask pop-up shows a summary of UTXOs
- ✅ Returns at least one UTXO
- ✅ UTXO shows value of `0.10` HTR
- ✅ UTXO includes `txId` and `index`
- ✅ No errors shown

---

### 2.3 Send Transaction
1. Click "Move UTXOs Around" to auto-fill inputs
2. In outputs section, enter:
   - Address: Leave the suggested address
   - Value: `1` ( equivalent to 0.01 HTR )
   - Token: `00`
3. Set change address to address index 0
4. Click action button
5. Confirm the values in the MetaMask pop-up
6. Approve transaction in MetaMask
- ✅ Transaction hash returned
- ✅ No errors shown
- ✅ Double-check the transaction on the Explorer

---

### 2.4 Create Token
1. Enter custom token details or leave the default values
4. Click action button
5. Validate all values in MetaMask pop-up
- ✅ New token ID returned in property "hash" (64-character hex string)
- ✅ Transaction successful
- ✅ No errors shown

---

### 2.5 Bet Nano Contract Flow
This tests the complete betting flow across multiple cards.

#### 2.5.1 Initialize Bet
1. Use the pre-filled values or enter your own ( leave the Oracle Address as index 0 )
2. Take special attention to the Bet Deadline, leaving time for you to execute at least two bets ( one hour by default ).
3. De-select the "Push Transaction" field and click action button
4. Confirm values in MetaMask pop-up, noting that there is a `oracle_script` field that is hashed from the oracle address
5. Approve in MetaMask
- ✅ A large hash is returned as result
6. Now, go back to the card and select "Push Transaction"
7. Click action button again and approve in MetaMask
- ✅ Nano contract ID returned (64-character hex)
- ✅ Nano contract ID auto-populated for other bet cards
- ✅ No errors shown

---

#### 2.5.2 Place Bet (loser)
1. Verify nano contract ID is auto-filled
2. Enter:
   - Bet choice: `2x0`
   - Amount: `2` (0.02 HTR)
   - Token: `00`
   - Address: Any other than Index 0 ( as it will be used later )
3. De-select "Push Transaction" and Click action button
4. Validate all values in the pop-up and approve in MetaMask
- ✅ A large hash is returned as result
6. Now, go back to the card and select "Push Transaction"
6. Now, go back to the card and select "Push Transaction"
- ✅ Transaction successful
- ✅ No errors shown
7. Validate the bet transaction on the Explorer, checking that the Nano Contract balance has `0.02` HTR

#### 2.5.3 Place Bet (winner)
2. Enter the values:
   - Bet choice: `1x0`
   - Amount: `1` (0.01 HTR)
   - Token: `00`
   - Address: Your address at Index 0 (it can´t be another one)
6. Send the transaction
- ✅ Transaction successful
- ✅ No errors shown
7. Validate the bet transaction on the Explorer, checking that the Nano Contract balance now has `0.03` HTR

---

#### 2.5.4 Sign Oracle Data
Now that the time-sensitive part of placing bets is over, we can test signing the oracle data.
1. Enter the correct Nano Contract Id being used
2. Enter the data `1x0` (the winning result)
3. Enter Address Index `0` (the oracle address)
4. Click action button
5. Approve in MetaMask and validate that the signed result is not shown on the pop-up
6. Validate the full signature is shown on the screen results

#### 2.5.5 Set Bet Result
The signature above was not used anywhere, just calculated. Now we use the same internal process to set the result on-chain.
1. Make sure the values are:
   - Oracle address: Index 0
   - Result: `1x0`
2. De-select "Push Transaction" and Click action button
3. Validate all values in the pop-up and approve in MetaMask
- ✅ A large hash is returned as result
4. Now, go back to the card and select "Push Transaction"
5. Approve in MetaMask
- ✅ Oracle result set successfully
- ✅ No errors shown
6. Validate the transaction on the Explorer, checking that the Nano Contract state has the `final_result` = `1x0`

---

#### 2.5.6 Withdraw Bet Prize
1. Enter:
   - Withdrawal address: (address 0)
   - Amount: `3` (or full winning amount)
   - Token: `00`
2. Click action button
3. Approve in MetaMask ( do this without "Push Transaction" first to see the large hash )
- ✅ Withdrawal successful
- ✅ Funds returned to wallet
- ✅ No errors shown
4. Fetch the UTXOs for the `00` token again to confirm the winning amount is present
5. Check the Explorer to confirm the HTR balance for the Nano Contract is now empty

---

## Additional Checks

### Error Handling
- [ ] Request History section shows all executed requests
- [ ] Any errors are properly displayed with error codes
- [ ] Error details can be copied to clipboard

### Network Switching
> [!NOTE] Feature unavailable at the moment. To be tested in future releases.
- [ ] Change Network buttons work (Testnet ↔ Mainnet)
- [ ] Current network button is disabled
- [ ] Network change reflects in Get Network card

---

## Test Summary Checklist

**Phase 1 (Empty Wallet):**
- [ ] All wallet information cards return valid data
- [ ] Signature functionality works
- [ ] Empty balance/UTXO state correctly shown

**Phase 2 (Funded Wallet):**
- [ ] Balance correctly shows funded amount
- [ ] UTXOs properly returned
- [ ] Send transaction completes successfully
- [ ] Token creation works
- [ ] Complete bet nano contract flow executes without errors

**Overall:**
- [ ] No unexpected errors or crashes
- [ ] All results are properly formatted and readable
- [ ] MetaMask approval dialogs appear as expected

# Intermediate Tests
After the Smoke Tests are completed, consider running more in-depth tests covering parameter validations.

## UTXOs Filtering (Advanced)
- [ ] Test Get UTXOs with different token IDs ( use the one just created above )
- Send a transaction using one of the Custom Token UTXOs and generating two outputs: 45, 40. Select a change address.
- Validate that a change of 15 tokens was generated on the correct address.
- [ ] Fetch UTXOs for the custom token and validate filtering by:
  - Address ( select the change one, should return only 15 ) 
  - Minimum value (e.g., min 15 should return only 45 and 40
  - Maximum value (e.g., max 40 should return only 15)
  - Limit (e.g., limit 2 should return only two UTXOs)
  - Total Max Amount 55 (should return only 45 and 10)
  - Authorities `1` should return the Mint authority
  - Authorities `2` should return the Melt authority
  - Any mix of the above parameters

## Create Token with external addresses
- Try to create a token using an address that is not from the snap wallet ( e.g.: Your other address that sent `0.10` HTR to this one )
- Do not check the "Allow External * Authority" box and validate that an error is shown indicating the address is not from the wallet.
- Disable Mint authority, set Melt authority to your other wallet address, and check "Allow External Melt Authority".
- Set amount to 100 and validate that the token is created successfully.
- Send the created tokens to the other wallet and confirm you can melt them back to `0.01` HTR.

## Balance with custom tokens
- Put the IDs of all created tokens (including the custom one from above) in the Get Balance card.
- Validate that the balances are shown correctly for each token, even the one with 0.00 tokens.
