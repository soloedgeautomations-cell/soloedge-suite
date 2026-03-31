ALTER TABLE `users` ADD `assignedPhoneNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `tempPassword` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `magicLoginToken` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramChatId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramConnectToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramConnected` boolean DEFAULT false;