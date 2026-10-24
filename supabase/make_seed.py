"""Generates supabase/seed.sql: fictional demo restaurants, people, reviews and episodes.
Everything is marked is_demo = true so it can be removed before launch with supabase/clear_demo.sql.
Photos are free Unsplash images (unsplash.com/license)."""
import uuid, random, datetime

random.seed(7)
NS = uuid.UUID("6a1c3e52-7b1d-4c2a-9a55-1f0b6c2d9e10")
uid = lambda key: str(uuid.uuid5(NS, key))
U = lambda pid, w=900: f"https://images.unsplash.com/{pid}?w={w}&q=70&auto=format&fit=crop"
q = lambda s: "null" if s is None else "'" + str(s).replace("'", "''") + "'"

P = {
 "biryani1":"photo-1589302168068-964664d93dc0","biryani2":"photo-1631515243349-e0cb75fb8d3a","biryani3":"photo-1563379091339-03b21ab4a4f8",
 "biryani4":"photo-1633945274405-b6c8069047b0","bd1":"photo-1588644525273-f37b60d78512","bd2":"photo-1743674453123-93356ade2891",
 "bd3":"photo-1654863404432-cac67587e25d","fish1":"photo-1626508035297-0cd27c397d67","fish2":"photo-1620894580123-466ad3a0ca06",
 "grill1":"photo-1555939594-58d7cb561ad1","grill2":"photo-1771285119318-b342c3ecc51c","grill3":"photo-1777891258069-454e66f8bedc",
 "momo1":"photo-1694923450868-b432a8ee52aa","momo2":"photo-1784550368264-0228aacbf50d","burger1":"photo-1568901346375-23c9450c58cd",
 "burger2":"photo-1586190848861-99aa4a171e90","coffee1":"photo-1509042239860-f550ce710b93","coffee2":"photo-1542372147193-a7aca54189cd",
 "cake1":"photo-1768260732302-12822bd6427b","steak1":"photo-1588168333986-5078d3ae3976","steak2":"photo-1600891964092-4316c288032e",
 "ramen1":"photo-1569718212165-3a8278d5f624","ramen2":"photo-1623341214825-9f4f963727da","pizza1":"photo-1513104890138-7c749659a591",
 "pizza2":"photo-1565299624946-b28f40a0ae38","sea1":"photo-1615141982883-c7ad0e69fd62","sea2":"photo-1765100479761-2359e22fbe16",
 "int1":"photo-1517248135467-4c7edcad34c4","int2":"photo-1776763255189-3c8237aec808","int3":"photo-1667388969250-1c7220bf3f37",
 "haleem":"photo-1512010151537-2cf5c638ad51","dal":"photo-1788601988466-9f361c34c6cb","stall":"photo-1779231127187-fe90c5d669c9",
 "chai":"photo-1544787219-7f47ccb76574",
}

DISHES = [  # slug, en, bn, photo
 ("kacchi","Kacchi biryani","কাচ্চি বিরিয়ানি","biryani1"),("tehari","Beef tehari","গরুর তেহারি","biryani2"),
 ("mezbani","Mezbani beef","মেজবানি মাংস","bd3"),("ilish","Shorshe ilish","সর্ষে ইলিশ","fish1"),
 ("kebab","Kebab platter","কাবাব","grill1"),("momo","Momo","মোমো","momo1"),("burger","Burger","বার্গার","burger1"),
 ("pizza","Pizza","পিৎজা","pizza1"),("ramen","Ramen","রামেন","ramen1"),("steak","Steak","স্টেক","steak1"),
 ("coffee","Coffee","কফি","coffee1"),("cake","Chocolate cake","চকলেট কেক","cake1"),("haleem","Haleem","হালিম","haleem"),
 ("bhorta","Bhorta & bhaat","ভর্তা-ভাত","bd1"),
]

R = [  # key, name, area, cuisine_en, cuisine_bn, price_level, avg_cost, cover, plates, taka_pick, google
 ("haji","Haji Lane Biryani House","olddhaka","Biryani · Old Dhaka","বিরিয়ানি · পুরান ঢাকা",1,450,"biryani3",3,True,4.4),
 ("brass","The Brass Fork","gulshan","Modern European","মডার্ন ইউরোপিয়ান",4,2800,"int2",2,False,4.6),
 ("mezban","Mezban Ghor","mohammadpur","Chittagonian","চাটগাঁইয়া",2,650,"bd3",1,True,4.3),
 ("tehari","Lakeside Tehari","banani","Tehari · Breakfast","তেহারি · নাস্তা",1,300,"biryani2",0,True,4.1),
 ("hilsa","Saltwater Hilsa","uttara","Bengali seafood","বাঙালি সামুদ্রিক",3,1300,"fish2",1,False,4.5),
 ("chaa","Chaa Nagar","dhanmondi","Tea · Snacks","চা · নাস্তা",1,150,"chai",0,True,4.2),
 ("smoke","Smoke & Naan","bashundhara","Grill · Mughlai","গ্রিল · মোগলাই",2,900,"grill2",0,True,4.0),
 ("dumpling","Dhanmondi Dumplings","dhanmondi","Momo · Chinese","মোমো · চাইনিজ",2,500,"momo2",0,True,4.3),
 ("nawab","Nawab's Table","olddhaka","Mughlai · Kebab","মোগলাই · কাবাব",2,700,"grill3",2,True,4.2),
 ("ember","Ember Steakhouse","gulshan","Steakhouse","স্টেকহাউস",4,3500,"steak2",1,False,4.5),
 ("kumari","Kumari Ramen Bar","banani","Japanese · Ramen","জাপানি · রামেন",3,1100,"ramen2",0,False,4.4),
 ("slice","Slice Theory","dhanmondi","Pizza","পিৎজা",2,900,"pizza2",0,True,4.1),
 ("thirdwave","Third Wave Café","gulshan","Coffee · Brunch","কফি · ব্রাঞ্চ",2,600,"coffee2",0,False,4.6),
 ("crumb","Crumb & Cocoa","uttara","Desserts","ডেজার্ট",2,500,"cake1",0,True,4.3),
 ("patty","Patty Shack","bashundhara","Burgers","বার্গার",2,650,"burger2",0,True,4.0),
 ("shorshe","Shorshe Kitchen","mohammadpur","Home-style Bengali","ঘরোয়া বাঙালি",1,350,"bd2",1,True,4.4),
 ("tides","Tides Seafood Bar","gulshan","Seafood","সামুদ্রিক খাবার",4,3200,"sea1",0,False,4.3),
 ("chawk","Chawk Haleem Corner","olddhaka","Haleem · Street food","হালিম · স্ট্রিট ফুড",1,200,"stall",0,True,4.0),
]

PEOPLE = [  # key, name, username, role, bio, club
 ("nusrat","Nusrat Jahan","nusrat.eats","critic","Old Dhaka kacchi hunter. 300+ places ranked.",True),
 ("tanvir","Tanvir Ahmed","tanvir.tastes","critic","Chittagonian food, grills, and anything with mustard oil.",True),
 ("mehjabin","Mehjabin Karim","mehjabin.dines","critic","Fine dining and coffee nerd. Honest, sometimes harsh.",True),
 ("arif","Arif Chowdhury","arif.on.a.plate","critic","Street food and cheap eats under ৳500.",False),
 ("rafi","Rafi Hasan","rafi.h","member","Student. Will travel across Dhaka for good momo.",False),
 ("sadia","Sadia Islam","sadia.bites","member","Brunch, cake, repeat.",True),
 ("zubair","Zubair Rahman","zubair.r","member","Burgers and late-night food.",False),
 ("labiba","Labiba Haque","labiba.cooks","member","Home cook, judging everyone's bhorta.",False),
]

REV = [  # restaurant, person, dish slug, score, cleanliness, spent, photo key or None, text, verified
 ("haji","nusrat","kacchi",9.7,4,420,"biryani1","Meat falls off the bone and the aloo is soaked in ghee. Go before 1pm or it sells out. ৳380 for a full plate is a steal.",True),
 ("haji","arif","kacchi",9.4,3,400,"biryani4","Still the benchmark for Old Dhaka kacchi. Seating is tight and hot, but nobody comes here for the chairs.",True),
 ("haji","rafi","kacchi",9.0,3,380,None,"Took friends from Chattogram here and they went quiet for ten minutes. That says enough.",False),
 ("haji","zubair","kacchi",8.6,3,450,"biryani3","Great rice, slightly less meat than last time. Borhani is excellent.",False),
 ("brass","mehjabin","steak",8.9,5,3200,"steak2","Crisp duck skin, perfect lentils, and the best service in Gulshan right now. Book on weekends.",True),
 ("brass","sadia","cake",8.2,5,2400,"cake1","Dessert menu is better than the mains. Beautiful room for a birthday dinner.",False),
 ("brass","tanvir",None,7.4,5,3000,None,"Very polished, but the portions are small for the price. Good for a special night, not a regular.",True),
 ("mezban","tanvir","mezbani",9.3,3,600,"bd3","Closest thing to a real Chattogram mezban in Dhaka. Proper black-pepper heat. Ask for extra kala bhuna gravy.",True),
 ("mezban","arif","mezbani",9.0,3,550,None,"Under ৳600 for a meal this good. Lunch rush is chaos, go at 3pm.",True),
 ("mezban","labiba","bhorta",8.4,4,500,"bd1","Their shutki bhorta is the real thing. Rice was a bit overcooked.",False),
 ("tehari","arif","tehari",8.1,3,250,"biryani2","Morning tehari with a cold borhani. Simple, cheap, consistent.",True),
 ("tehari","rafi","tehari",7.6,2,280,None,"Tasty but the place needs a deep clean. Takeaway is the move.",False),
 ("hilsa","tanvir","ilish",8.6,4,1400,"fish1","Mustard is sharp the way it should be, fish was fresh. Portion is small for the price.",True),
 ("hilsa","labiba","ilish",8.0,4,1200,"fish2","Close to home cooking. Their bhapa ilish is better than the fried one.",False),
 ("chaa","arif",None,7.2,3,120,"chai","Malai cha is great, the singara was cold. Worth it for the tea and the lake breeze.",False),
 ("chaa","rafi",None,6.4,2,150,None,"Good tea, too crowded in the evening.",False),
 ("smoke","zubair","kebab",8.3,4,850,"grill2","Chicken tikka is juicy and the naan comes out blistered. Generous platter.",False),
 ("smoke","tanvir","kebab",7.8,4,900,"grill1","Solid grill, slightly heavy on the food colouring. Seekh kebab is the pick.",True),
 ("dumpling","rafi","momo",8.8,4,450,"momo1","Pan-fried momo with a proper crisp bottom. The chilli sauce is dangerous.",False),
 ("dumpling","sadia","momo",8.2,4,500,"momo2","Steamed ones are soft and juicy. Great for a quick bite after college.",False),
 ("nawab","nusrat","kebab",9.1,3,650,"grill3","Shami kebab that melts. The nehari on Fridays is worth the trip to Old Dhaka.",True),
 ("nawab","arif","haleem",8.7,3,350,"haleem","Thick, slow-cooked haleem with proper bone marrow. Cheap and filling.",True),
 ("ember","mehjabin","steak",8.8,5,3800,"steak1","Ribeye was cooked exactly medium-rare. Pricey, but this is the best steak I've had in Dhaka.",True),
 ("ember","zubair","steak",8.1,5,3500,None,"Excellent meat, sides are forgettable. Save it for a celebration.",False),
 ("kumari","sadia","ramen",8.5,5,1100,"ramen1","Rich tonkotsu broth and a perfectly jammy egg. Small place, expect a wait.",False),
 ("kumari","mehjabin","ramen",7.9,5,1200,"ramen2","Broth is good, noodles slightly soft. Still the best ramen in Banani.",True),
 ("slice","zubair","pizza",8.0,4,850,"pizza1","Thin crust done right. The beef pepperoni is the one.",False),
 ("slice","rafi","pizza",7.5,4,800,None,"Good pizza, a bit expensive for the size.",False),
 ("thirdwave","mehjabin","coffee",9.0,5,550,"coffee1","Properly pulled espresso and a barista who knows the beans. Best flat white in Gulshan.",True),
 ("thirdwave","sadia","coffee",8.6,5,700,"coffee2","Brunch is lovely, croissants are flaky. Gets loud on Fridays.",False),
 ("crumb","sadia","cake",8.9,5,450,"cake1","The chocolate fudge cake is unreal. Not too sweet, very rich.",False),
 ("crumb","labiba","cake",7.7,4,400,None,"Good cakes, the pastries were a day old.",False),
 ("patty","zubair","burger",8.4,4,600,"burger1","Smashed patties with crispy edges. The best burger under ৳600 in Bashundhara.",False),
 ("patty","rafi","burger",7.0,3,650,"burger2","Burger was great, fries were soggy.",False),
 ("shorshe","labiba","bhorta",9.2,5,300,"bd2","Twelve kinds of bhorta and hot rice for ৳300. Tastes like my nani's kitchen.",True),
 ("shorshe","nusrat","bhorta",8.8,4,350,"bd1","Simple food done with love. The dal is perfect.",True),
 ("shorshe","tanvir","ilish",8.5,4,400,None,"Shorshe ilish at a home-style price. Fish was small but fresh.",True),
 ("tides","mehjabin",None,7.6,5,3400,"sea2","Fresh seafood, but the sauces drown it. Grilled prawns are the safe order.",True),
 ("tides","sadia",None,8.1,5,3000,"sea1","Lovely platter for sharing. Pricey, but a great date spot.",False),
 ("chawk","arif","haleem",8.9,2,180,"stall","Best haleem under ৳200, eaten standing on the street. Not for the fussy.",True),
 ("chawk","nusrat","haleem",8.5,2,200,None,"Iftar-time queue is long but it moves fast. Bring cash.",False),
]

EPISODES = [  # title, guest, role, restaurant, dish, thumb
 ("The kacchi that made a singer late for her own show","Raima Sultana","Singer (fictional guest)","haji","Kacchi biryani","biryani4"),
 ("A fast bowler's post-match haleem","Tamim Hossain","Cricketer (fictional guest)","chawk","Haleem","stall"),
 ("An actor's secret bhorta spot","Shafin Ahmed","Actor (fictional guest)","shorshe","Bhorta & bhaat","bd2"),
]

FOLLOWS = [("rafi","nusrat"),("rafi","tanvir"),("sadia","mehjabin"),("zubair","nusrat"),("labiba","tanvir"),("labiba","nusrat"),
           ("sadia","nusrat"),("arif","nusrat"),("nusrat","arif"),("mehjabin","tanvir"),("tanvir","mehjabin"),("zubair","arif")]

now = datetime.datetime(2026, 10, 24, 12, 0, tzinfo=datetime.timezone.utc)
out = ["-- Palate demo data (generated by make_seed.py). Remove with clear_demo.sql.", "begin;"]
out.append("insert into public.dishes (slug, name_en, name_bn, photo_url) values")
out.append(",\n".join(f"({q(s)},{q(e)},{q(b)},{q(U(P[p],600))})" for s, e, b, p in DISHES) + "\non conflict (slug) do nothing;")

out.append("insert into public.profiles (id, display_name, username, role, bio, club_until, is_demo) values")
out.append(",\n".join(f"({q(uid('p:'+k))},{q(n)},{q(u)},{q(r)},{q(b)},{'now() + interval ' + q('365 days') if c else 'null'},true)"
                      for k, n, u, r, b, c in PEOPLE) + ";")

out.append("insert into public.restaurants (id, name, area, cuisine_en, cuisine_bn, price_level, avg_cost, cover_url, plates, taka_pick, google_rating, is_demo) values")
out.append(",\n".join(f"({q(uid('r:'+k))},{q(n)},{q(a)},{q(ce)},{q(cb)},{pl},{ac},{q(U(P[cv]))},{pt},{str(tp).lower()},{g},true)"
                      for k, n, a, ce, cb, pl, ac, cv, pt, tp, g in R) + ";")

rows = []
for i, (rk, pk, dish, score, clean, spent, photo, text, ver) in enumerate(REV):
    created = now - datetime.timedelta(minutes=random.randint(20, 60 * 24 * 40))
    bucket = "loved" if score >= 6.8 else "fine" if score >= 4 else "bad"
    dish_sql = f"(select id from public.dishes where slug={q(dish)})" if dish else "null"
    dish_name = next((e for s, e, b, p in DISHES if s == dish), None) or "Mixed order"
    photos = f"array[{q(U(P[photo]))}]" if photo else "'{}'"
    rows.append(f"({q(uid('v:'+str(i)))},{q(uid('p:'+pk))},{q(uid('r:'+rk))},{dish_sql},{q(dish_name)},{q(text)},{q(bucket)},{score},{clean},{spent},{photos},{str(ver).lower()},true,{q(created.isoformat())})")
out.append("insert into public.reviews (id, user_id, restaurant_id, dish_id, dish_name, body, bucket, score, cleanliness, spent, photo_urls, verified, is_demo, created_at) values")
out.append(",\n".join(rows) + ";")

# Each demo person's ranked list comes from their reviews
rk_rows = []
for pk, *_ in PEOPLE:
    mine = sorted([(s, rk) for rk, p, d, s, *_ in REV if p == pk], reverse=True)
    seen = []
    for s, rk in mine:
        if rk in seen: continue
        seen.append(rk)
        bucket = "loved" if s >= 6.8 else "fine" if s >= 4 else "bad"
        rk_rows.append(f"({q(uid('p:'+pk))},{q(uid('r:'+rk))},{q(bucket)},{len(seen)-1},{s})")
out.append("insert into public.rankings (user_id, restaurant_id, bucket, position, score) values\n" + ",\n".join(rk_rows) + ";")

out.append("insert into public.follows (follower_id, following_id) values\n" +
           ",\n".join(f"({q(uid('p:'+a))},{q(uid('p:'+b))})" for a, b in FOLLOWS) + ";")

like_rows, help_rows = set(), set()
people = [p[0] for p in PEOPLE]
for i, (rk, pk, *_rest) in enumerate(REV):
    for other in random.sample([p for p in people if p != pk], random.randint(1, 6)):
        like_rows.add((uid('p:'+other), uid('v:'+str(i))))
    for other in random.sample([p for p in people if p != pk], random.randint(0, 4)):
        help_rows.add((uid('p:'+other), uid('v:'+str(i))))
out.append("insert into public.likes (user_id, review_id) values\n" + ",\n".join(f"({q(a)},{q(b)})" for a, b in sorted(like_rows)) + ";")
out.append("insert into public.review_helpful (user_id, review_id) values\n" + ",\n".join(f"({q(a)},{q(b)})" for a, b in sorted(help_rows)) + ";")

out.append("insert into public.episodes (title, guest_name, guest_role, restaurant_id, favourite_dish, thumbnail_url, published_at, is_demo) values")
out.append(",\n".join(f"({q(t)},{q(g)},{q(r)},{q(uid('r:'+rk))},{q(d)},{q(U(P[th]))},now() - interval {q(str(i*9)+' days')},true)"
                      for i, (t, g, r, rk, d, th) in enumerate(EPISODES)) + ";")

out.append("insert into public.flags (review_id, user_id, reason) values")
out.append(f"({q(uid('v:11'))},{q(uid('p:labiba'))},'Looks like the owner wrote this'),\n({q(uid('v:33'))},{q(uid('p:sadia'))},'Photo is from another restaurant');")
out.append("insert into public.critic_applications (user_id, motivation) values")
out.append(f"({q(uid('p:rafi'))},'I have reviewed 40+ momo and street food spots across Dhaka and want to help people find honest cheap eats.'),\n({q(uid('p:sadia'))},'Brunch and dessert specialist, I post detailed reviews with photos every week.');")
out.append("commit;")

open("supabase/seed.sql", "w").write("\n".join(out) + "\n")
open("supabase/clear_demo.sql", "w").write("""-- Removes all Palate demo data (restaurants, people, reviews and episodes marked is_demo).
delete from public.episodes where is_demo;
delete from public.reviews where is_demo;
delete from public.restaurants where is_demo;
delete from public.profiles where is_demo;
""")
print("reviews", len(REV), "restaurants", len(R), "people", len(PEOPLE))
