-- Zero-Touch Provisioning: add Twilio phone number and temp password columns to users
ALTER TABLE `users` ADD `assignedPhoneNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `tempPassword` varchar(128);
