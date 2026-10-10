-- Point catalog rows at tax-inclusive Stripe prices (tax_behavior=inclusive).
-- Apply together with the deploy that turns on Checkout automatic_tax.
-- Old prices stay in Stripe until a Utah-address checkout is verified; archive
-- them only after that.

UPDATE public.products SET stripe_price_id = CASE stripe_price_id
 WHEN 'price_1TSlCzLMKed5UHTWIP6xSoqt' THEN 'price_1UP5WNLMKed5UHTWohAuHG2W'
 WHEN 'price_1TSlFCLMKed5UHTWoj4GGmgt' THEN 'price_1UP5WRLMKed5UHTWll8kg03N'
 WHEN 'price_1TSlIDLMKed5UHTWDXJD9FpL' THEN 'price_1UP5WRLMKed5UHTWDh9C2p2h'
 WHEN 'price_1TSpnuLMKed5UHTWv8DC2AIJ' THEN 'price_1UP5WSLMKed5UHTWfezOKN2M'
 WHEN 'price_1TSpq9LMKed5UHTWDthDOUb5' THEN 'price_1UP5WTLMKed5UHTWVlmUb4Td'
 WHEN 'price_1TSprhLMKed5UHTWvG3gUGjm' THEN 'price_1UP5WTLMKed5UHTWu2jNa4PH'
 WHEN 'price_1TSq2CLMKed5UHTWmVg29Kwd' THEN 'price_1UP5WULMKed5UHTWnnrIp2Ca'
 WHEN 'price_1TSq2cLMKed5UHTWyhngebYR' THEN 'price_1UP5WVLMKed5UHTW3eimfmdx'
 WHEN 'price_1TSq3lLMKed5UHTWAEpwAzre' THEN 'price_1UP5WWLMKed5UHTWy8U3OS1L'
 WHEN 'price_1TSqZZLMKed5UHTWkPhxHtZb' THEN 'price_1UP5WXLMKed5UHTW4lrrkfA5'
 WHEN 'price_1TT4eRLMKed5UHTWCt5ov44t' THEN 'price_1UP5WXLMKed5UHTWfKS6CnLt'
 WHEN 'price_1TT4g6LMKed5UHTWPu6HpzGX' THEN 'price_1UP5WYLMKed5UHTWDVjuuGq9'
 WHEN 'price_1TSpusLMKed5UHTW7Qk28m2Q' THEN 'price_1UP5apLMKed5UHTWfL8t97C4'
 WHEN 'price_1TSpyoLMKed5UHTWX7kgrw5x' THEN 'price_1UP5apLMKed5UHTW2FAJ8tuF'
 WHEN 'price_1TSq03LMKed5UHTWtT0c2GP5' THEN 'price_1UP5aqLMKed5UHTWNbSiLCQf'
 ELSE stripe_price_id END
WHERE stripe_price_id IN ('price_1TSlCzLMKed5UHTWIP6xSoqt','price_1TSlFCLMKed5UHTWoj4GGmgt','price_1TSlIDLMKed5UHTWDXJD9FpL','price_1TSpnuLMKed5UHTWv8DC2AIJ','price_1TSpq9LMKed5UHTWDthDOUb5','price_1TSprhLMKed5UHTWvG3gUGjm','price_1TSq2CLMKed5UHTWmVg29Kwd','price_1TSq2cLMKed5UHTWyhngebYR','price_1TSq3lLMKed5UHTWAEpwAzre','price_1TSqZZLMKed5UHTWkPhxHtZb','price_1TT4eRLMKed5UHTWCt5ov44t','price_1TT4g6LMKed5UHTWPu6HpzGX','price_1TSpusLMKed5UHTW7Qk28m2Q','price_1TSpyoLMKed5UHTWX7kgrw5x','price_1TSq03LMKed5UHTWtT0c2GP5');
