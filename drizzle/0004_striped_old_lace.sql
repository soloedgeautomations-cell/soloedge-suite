ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripePlanId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionStatus` varchar(32);