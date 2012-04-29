#!/usr/bin/python

import pygtk
pygtk.require('2.0')
import gtk
import gtk.gdk
import webkit

# Change stuff here! #
title = "DuskWolf"
width = 1280
height = 768 # These should be changed in DuskWolfPy.html too
icons = (
gtk.gdk.pixbuf_new_from_file("Data/Examples/icon16.png"),
gtk.gdk.pixbuf_new_from_file("Data/Examples/icon32.png")
)
######################

class DuskWolf:
	def __init__(self):
		self.view = webkit.WebView()
		self.view.open("http://127.0.0.1:3445/DuskWolfPy.html")
		
		self.sw = gtk.ScrolledWindow() 
		self.sw.add(self.view)
		
		self.win = gtk.Window(gtk.WINDOW_TOPLEVEL)
		self.win.add(self.sw)
		self.win.set_title(title)
		self.win.set_default_size(width+10, height+10)
		print icons
		self.win.set_icon_list(*icons)
		self.win.show_all()
		
		self.win.connect("destroy", self.destroy)
	
	def main(self):
		try:
			gtk.main()
		except:
			print "Crashed, I shall stop the server now."
			server.stop()
	
	def destroy(widget, data=None):
		gtk.main_quit()
		server.stop()

#Server
import sys
import BaseHTTPServer 
from SimpleHTTPServer import SimpleHTTPRequestHandler
import threading

class Server(threading.Thread):
	def run (self):
		SimpleHTTPRequestHandler.protocol_version = "HTTP/1.0"
		self.httpd = BaseHTTPServer.HTTPServer(('127.0.0.1', 3445), SimpleHTTPRequestHandler)

		self.httpd.serve_forever()
	
	def stop(self):
		self.httpd.socket.close()

server = None
if __name__ == "__main__":
	server = Server()
	server.start()
	duskWolf = DuskWolf()
	duskWolf.main()
